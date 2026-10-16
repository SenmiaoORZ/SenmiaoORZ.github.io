#!/usr/bin/env python3
"""Publish aggregate GoatCounter statistics; the API token stays in the environment."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

UTC = dt.timezone.utc

def country_rows(fetch, start, end):
    countries = {}
    offset = 0
    while True:
        response = fetch('stats/locations', start=start, end=end, limit=100, offset=offset)
        stats = response.get('stats') or []
        for row in stats:
            code = str(row.get('id', '')).upper()
            # Region details are deliberately not exported.
            if not re.fullmatch(r'[A-Z]{2}', code):
                continue
            count = int(row.get('count', 0))
            if count <= 0:
                continue
            if code not in countries:
                countries[code] = {'code': code, 'name': row.get('name') or code, 'count': 0}
            countries[code]['count'] += count
        if not response.get('more'):
            break
        if not stats or offset >= 300:
            raise ValueError('Incomplete country pagination; refusing to publish a partial map')
        offset += len(stats)
    return sorted(countries.values(), key=lambda row: (-row['count'], row['code']))

def build_snapshot(fetch, account, now):
    end = (now.replace(minute=0, second=0, microsecond=0) + dt.timedelta(hours=1)).isoformat()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    ranges = {'all': dt.datetime(2000, 1, 1, tzinfo=UTC), 'week': today-dt.timedelta(days=6), 'month': today-dt.timedelta(days=29)}
    periods = {}
    for name, start in ranges.items():
        total = fetch('stats/total', start=start.isoformat(), end=end)
        visits = int(total.get('total_utc', total.get('total', 0)))
        # This homepage records page visits only, with no click events.
        countries = country_rows(fetch, start.isoformat(), end)
        periods[name] = {'visits': max(0, visits), 'countries': countries}
    return {'provider': 'GoatCounter', 'account': account, 'available': True,
            'generatedAt': now.isoformat(), 'total': periods['all']['visits'], 'periods': periods}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', default='senmiaoorz')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'data/visitors.json')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-z0-9-]+', args.site):
        parser.error('Invalid GoatCounter account name')
    token = os.environ.get('GOATCOUNTER_API_TOKEN', '').strip()
    if not token:
        parser.error('Set GOATCOUNTER_API_TOKEN to a token with Read statistics permission')
    def fetch(path, **query):
        # Stay below GoatCounter's four API requests per second limit.
        time.sleep(.3)
        url = f'https://{args.site}.goatcounter.com/api/v0/{path}?{urlencode(query)}'
        request = Request(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'User-Agent': 'ZesenHomepageStats/1.0'})
        with urlopen(request, timeout=25) as response:
            return json.load(response)
    try:
        result = build_snapshot(fetch, args.site, dt.datetime.now(UTC))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.output.with_suffix('.tmp')
        temporary.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')
        temporary.replace(args.output)
    except HTTPError as error:
        print(f'GoatCounter API returned HTTP {error.code}; existing statistics were preserved.', file=sys.stderr)
        return 1
    except (URLError, ValueError, KeyError, TypeError, OSError) as error:
        print(f'Could not update aggregate statistics ({type(error).__name__}); existing statistics were preserved.', file=sys.stderr)
        return 1
    print('Updated aggregate totals and country counts. No visitor identifiers were exported.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
