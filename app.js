/* Personal homepage UI. All content and assets are served locally. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const themePreference = window.matchMedia('(prefers-color-scheme: dark)');
  const readPreference = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage can be unavailable in private contexts. */ } };
  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    $('theme-toggle').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#172b28' : '#eaf2ed';
    window.dispatchEvent(new Event('site-theme-change'));
  };
  setTheme(readPreference('zesen-theme') || (themePreference.matches ? 'dark' : 'light'));
  $('theme-toggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    savePreference('zesen-theme', theme);
    setTheme(theme);
  });
  themePreference.addEventListener('change', (event) => {
    if (!readPreference('zesen-theme')) setTheme(event.matches ? 'dark' : 'light');
  });
  $('year').textContent = new Date().getFullYear();

  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').classList.add('show');
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
  }
  async function createMikuRain() {
    if (!window.Matter) throw new Error('The local physics engine could not load.');
    const { Engine, Bodies, Body, Composite, Constraint, Query, Sleeping } = window.Matter;
    const canvas = $('miku-world');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');
    const image = new Image();
    image.src = new URL('assets/miku.png', document.baseURI).href;
    await image.decode();

    const engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 6 });
    engine.gravity.y = 1.05;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let walls = [];
    let friends = [];
    let target = 0;
    let automaticTarget = 0;
    let hardLimit = 0;
    let time = 0;
    let nextSpawn = 600;
    let accumulator = 0;
    let previousTime = null;
    let frame = null;
    let drag = null;
    let draggingPointer = null;
    let paused = motionPreference.matches || readPreference('zesen-rain-paused') === 'true';
    let hidden = false;
    let settled = false;
    let destroyed = false;
    const spriteCache = new Map();
    const STEP = 1000 / 60;

    function spritesize() {
      const options = width < 600 ? [42, 48, 56] : [58, 68, 78];
      return options[Math.floor(Math.random() * options.length)];
    }
    function sprite(size) {
      const key = `${size}-${pixelRatio}`;
      if (!spriteCache.has(key)) {
        const tile = document.createElement('canvas');
        tile.width = Math.ceil(size * pixelRatio);
        tile.height = Math.ceil(size * pixelRatio);
        const tileContext = tile.getContext('2d');
        const imageHeight = tile.height;
        const imageWidth = imageHeight * image.naturalWidth / image.naturalHeight;
        tileContext.drawImage(image, (tile.width - imageWidth) / 2, 0, imageWidth, imageHeight);
        spriteCache.set(key, tile);
      }
      return spriteCache.get(key);
    }
    function draw() {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalAlpha = document.documentElement.dataset.theme === 'dark' ? 0.82 : 0.9;
      for (const friend of friends) {
        const { x, y } = friend.position;
        const size = friend.plugin.spriteSize;
        if (y < -size || y > height + size) continue;
        context.save();
        context.translate(x, y);
        context.rotate(friend.angle);
        context.drawImage(sprite(size), -size / 2, -size / 2, size, size);
        context.restore();
      }
      context.globalAlpha = 1;
    }
    function updateControls() {
      const count = friends.length;
      $('rain-status').textContent = hidden ? 'Hidden · enjoy the reading' :
        paused ? (motionPreference.matches && !count ? 'Paused · reduced motion' : `Paused · ${count} little friends`) :
        !count ? 'A little joy, incoming…' : settled ? `${count} little friends · settled` : `${count} little friends${count < target ? ' & counting' : ''}`;
      const isPaused = paused || hidden;
      $('rain-pause').classList.toggle('is-paused', isPaused);
      $('rain-pause').setAttribute('aria-pressed', String(isPaused));
      $('rain-pause').setAttribute('aria-label', isPaused ? 'Resume Miku rain' : 'Pause Miku rain');
      $('rain-pause').title = isPaused ? 'Resume' : 'Pause';
      $('rain-hide').setAttribute('aria-pressed', String(hidden));
      $('rain-hide').setAttribute('aria-label', hidden ? 'Show Miku rain' : 'Hide Miku rain');
      $('rain-hide').title = hidden ? 'Show animation' : 'Hide animation';
      canvas.classList.toggle('is-hidden', hidden);
    }
    function releaseDrag() {
      if (drag) Composite.remove(engine.world, drag);
      drag = null;
      if (draggingPointer !== null && canvas.hasPointerCapture(draggingPointer)) canvas.releasePointerCapture(draggingPointer);
      draggingPointer = null;
      canvas.style.cursor = 'default';
    }
    function fitWorld() {
      const previousWidth = width;
      const previousHeight = height;
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      spriteCache.clear();
      releaseDrag();
      walls.forEach((wall) => Composite.remove(engine.world, wall));
      // The floor and side walls follow the viewport, keeping the pile in view while scrolling.
      walls = [
        Bodies.rectangle(width / 2, height + 60, width + 240, 120, { isStatic: true, label: 'floor', friction: 0.65 }),
        Bodies.rectangle(-60, height / 2 - 160, 120, height + 800, { isStatic: true, label: 'left wall' }),
        Bodies.rectangle(width + 60, height / 2 - 160, 120, height + 800, { isStatic: true, label: 'right wall' })
      ];
      Composite.add(engine.world, walls);
      const mobile = width < 600;
      const meanRadius = mobile ? 21 : 30;
      automaticTarget = Math.max(45, Math.min(mobile ? 140 : 290, Math.round(width * height * 0.66 / (Math.PI * meanRadius ** 2))));
      hardLimit = mobile ? 190 : 400;
      // Keep memory bounded when a desktop window becomes a phone-sized window.
      if (friends.length > hardLimit) {
        friends.splice(hardLimit).forEach((friend) => Composite.remove(engine.world, friend));
      }
      target = Math.min(hardLimit, Math.max(friends.length, automaticTarget));
      if (previousWidth && previousHeight) {
        for (const friend of friends) {
          if (mobile && friend.plugin.spriteSize > 56) {
            const scale = 48 / friend.plugin.spriteSize;
            Body.scale(friend, scale, scale);
            friend.plugin.spriteSize = 48;
          }
          Body.setPosition(friend, {
            x: Math.max(friend.circleRadius, Math.min(width - friend.circleRadius, friend.position.x * width / previousWidth)),
            y: Math.min(height - friend.circleRadius, friend.position.y * height / previousHeight)
          });
          Sleeping.set(friend, false);
        }
      }
      settled = false;
      draw();
      updateControls();
      wake();
    }
    function spawn(x, y) {
      if (friends.length >= hardLimit) return;
      const size = spritesize();
      const radius = size * 0.44;
      const safeX = Math.max(radius + 2, Math.min(width - radius - 2, x ?? Math.random() * width));
      const friend = Bodies.circle(safeX, y ?? -size, radius, {
        label: 'Miku', restitution: 0.38, friction: 0.48, frictionStatic: 0.85,
        frictionAir: 0.008, density: 0.0012, sleepThreshold: 75,
        plugin: { spriteSize: size }
      });
      Body.setAngle(friend, (Math.random() - 0.5) * 1.5);
      Body.setAngularVelocity(friend, (Math.random() - 0.5) * 0.09);
      Body.setVelocity(friend, { x: (Math.random() - 0.5) * 2.6, y: 0 });
      Composite.add(engine.world, friend);
      friends.push(friend);
      settled = false;
      updateControls();
    }
    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
      accumulator = 0;
    }
    function wake() {
      if (destroyed || paused || hidden || document.hidden || frame !== null || !width) return;
      previousTime = null;
      frame = requestAnimationFrame(animate);
    }
    function animate(now) {
      frame = null;
      if (destroyed || paused || hidden || document.hidden) { previousTime = null; return; }
      const delta = previousTime === null ? STEP : Math.min(50, now - previousTime);
      previousTime = now;
      time += delta;
      accumulator += delta;
      if (friends.length < target && time >= nextSpawn) {
        spawn();
        // Small staggered groups feel like a shower rather than a single stream.
        if (Math.random() > 0.5 && friends.length < target) spawn();
        nextSpawn = time + (width < 600 ? 145 : 120);
      }
      while (accumulator >= STEP) {
        Engine.update(engine, STEP);
        accumulator -= STEP;
      }
      draw();
      if (!drag && friends.length >= target && friends.every((friend) => friend.isSleeping)) {
        settled = true;
        previousTime = null;
        updateControls();
        return;
      }
      frame = requestAnimationFrame(animate);
    }
    function resume() {
      paused = false;
      hidden = false;
      savePreference('zesen-rain-paused', 'false');
      settled = false;
      updateControls();
      wake();
    }
    function more() {
      resume();
      if (friends.length >= hardLimit) {
        friends.forEach((friend, index) => {
          if (index % 3 !== 0) return;
          Sleeping.set(friend, false);
          Body.setVelocity(friend, { x: (Math.random() - 0.5) * 5, y: -5 - Math.random() * 7 });
          Body.setAngularVelocity(friend, (Math.random() - 0.5) * 0.15);
        });
        toast('One very happy Miku pile. Give it a little bounce!');
      } else {
        target = Math.min(hardLimit, Math.max(target, friends.length) + 30);
        for (let index = 0; index < 8 && friends.length < hardLimit; index++) spawn(Math.random() * width, -60 - index * 64);
        nextSpawn = time + 80;
      }
      wake();
    }
    $('rain-pause').addEventListener('click', () => {
      if (paused || hidden) { resume(); return; }
      paused = true;
      savePreference('zesen-rain-paused', 'true');
      releaseDrag();
      stop();
      updateControls();
    });
    $('rain-replay').addEventListener('click', () => {
      releaseDrag();
      friends.forEach((friend) => Composite.remove(engine.world, friend));
      friends = [];
      Engine.clear(engine);
      target = automaticTarget;
      time = 0;
      nextSpawn = 150;
      draw();
      resume();
    });
    $('rain-more').addEventListener('click', more);
    $('make-rain').addEventListener('click', more);
    $('rain-hide').addEventListener('click', () => {
      hidden = !hidden;
      if (hidden) { releaseDrag(); stop(); } else { draw(); wake(); }
      updateControls();
    });
    canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || hidden || paused) return;
      const point = { x: event.clientX, y: event.clientY };
      const friend = Query.point(friends, point).at(-1);
      if (!friend) {
        target = Math.min(hardLimit, Math.max(target, friends.length + 4));
        for (let index = 0; index < 3; index++) spawn(point.x + index * 14, point.y - index * 70);
        wake();
        return;
      }
      Sleeping.set(friend, false);
      drag = Constraint.create({ pointA: point, bodyB: friend, pointB: { x: 0, y: 0 }, stiffness: 0.16, damping: 0.12, length: 0 });
      Composite.add(engine.world, drag);
      draggingPointer = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      settled = false;
      wake();
    });
    canvas.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      if (drag) {
        drag.pointA.x = event.clientX;
        drag.pointA.y = event.clientY;
      } else if (!paused && !hidden) {
        canvas.style.cursor = Query.point(friends, { x: event.clientX, y: event.clientY }).length ? 'grab' : 'default';
      }
    });
    canvas.addEventListener('pointerup', releaseDrag);
    canvas.addEventListener('pointercancel', releaseDrag);
    canvas.addEventListener('lostpointercapture', () => { if (drag) releaseDrag(); });
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitWorld, 120); });
    window.addEventListener('site-theme-change', draw);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseDrag(); stop(); } else wake(); });
    motionPreference.addEventListener('change', (event) => {
      if (event.matches) {
        paused = true;
        releaseDrag();
        stop();
        updateControls();
      }
    });
    window.addEventListener('pagehide', () => { releaseDrag(); stop(); });
    window.addEventListener('pageshow', wake);
    fitWorld();
    ['rain-pause', 'rain-replay', 'rain-more', 'rain-hide', 'make-rain'].forEach((id) => { $(id).disabled = false; });
    updateControls();
  }
  createMikuRain().catch((error) => {
    $('rain-status').textContent = 'Animation unavailable';
    console.error('Miku rain:', error.message);
  });
})();
