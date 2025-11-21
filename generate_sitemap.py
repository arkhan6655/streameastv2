import requests
import json
import time
import base64
import os
from datetime import datetime, timezone

# Configuration
API_URL = "https://topembed.pw/api.php?format=json"
BASE_URL = "https://streameastv2.world" 
SITEMAP_FILE = "sitemap.xml"

# Static pages that should update only once a month (set to 1st of current month)
STATIC_PAGES_MONTHLY = ["/About/", "/Terms/", "/Privacy/", "/Disclaimer/", "/DMCA/", "/Contact/"]

# Pages that should always have TODAY'S date
PAGES_DAILY = ["", "/Schedule/"] # "" is Homepage

def get_current_date_str():
    """Returns today's date in YYYY-MM-DD format"""
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')

def get_first_of_month_str():
    """Returns the 1st day of the current month in YYYY-MM-DD format"""
    today = datetime.now(timezone.utc)
    return today.replace(day=1).strftime('%Y-%m-%d')

def generate_id(timestamp, sport, match):
    """
    Replicates the JS logic: btoa(unescape(encodeURIComponent(uniqueString)))
    In Python, standard b64encode of utf-8 string achieves the exact same result
    as the JS hack for UTF-8 support.
    """
    unique_string = f"{timestamp}_{sport}_{match}"
    # Encode string to bytes (UTF-8), then Base64 encode
    encoded_bytes = base64.b64encode(unique_string.encode('utf-8'))
    return encoded_bytes.decode('utf-8')

def get_matches():
    try:
        response = requests.get(API_URL, timeout=15)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Error fetching API: {e}")
        return []

    if not data or 'events' not in data:
        return []

    valid_matches = []
    # Use current UTC timestamp, matching JS `Math.floor(Date.now() / 1000)`
    now = int(time.time()) 

    # Loop through all dates in the API
    for date_key, events in data['events'].items():
        if not isinstance(events, list):
            events = [events]

        for event in events:
            try:
                unix_timestamp = int(event.get('unix_timestamp', 0))
                sport = event.get('sport', '')
                match_name = event.get('match', '')
                
                if not sport or not match_name or not unix_timestamp:
                    continue

                # === EXACT LOGIC FROM YOUR script.js ===
                diff_minutes = (now - unix_timestamp) / 60
                sport_lower = sport.lower()

                # 1. Logic for Cricket (Keep for 480 mins / 8 hours)
                if sport_lower == 'cricket' and diff_minutes >= 480:
                    continue # Remove from sitemap
                
                # 2. Logic for Other Sports (Keep for 180 mins / 3 hours)
                if sport_lower != 'cricket' and diff_minutes >= 180:
                    continue # Remove from sitemap
                
                # If it passes the checks, it goes into the sitemap
                # regardless of whether it is live, upcoming, or finished.
                
                unique_id = generate_id(unix_timestamp, sport, match_name)
                url = f"{BASE_URL}/Matchinformation/?id={unique_id}"
                
                valid_matches.append(url)

            except Exception as e:
                continue
                
    return valid_matches

def create_sitemap(match_urls):
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    current_date = get_current_date_str()
    month_start_date = get_first_of_month_str()

    # 1. Add Homepage & Schedule (Always Today's Date)
    for page in PAGES_DAILY:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{BASE_URL}{page}</loc>\n'
        xml_content += f'    <lastmod>{current_date}</lastmod>\n'
        xml_content += '    <changefreq>daily</changefreq>\n'
        xml_content += '    <priority>1.0</priority>\n'
        xml_content += '  </url>\n'

    # 2. Add Match Pages (Always Today's Date - even if match was yesterday)
    for url in match_urls:
        safe_url = url.replace("&", "&amp;")
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{safe_url}</loc>\n'
        xml_content += f'    <lastmod>{current_date}</lastmod>\n'
        xml_content += '    <changefreq>always</changefreq>\n'
        xml_content += '    <priority>0.8</priority>\n'
        xml_content += '  </url>\n'

    # 3. Add Static Pages (Date = 1st of Current Month)
    for page in STATIC_PAGES_MONTHLY:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{BASE_URL}{page}</loc>\n'
        xml_content += f'    <lastmod>{month_start_date}</lastmod>\n'
        xml_content += '    <changefreq>monthly</changefreq>\n'
        xml_content += '    <priority>0.5</priority>\n'
        xml_content += '  </url>\n'

    xml_content += '</urlset>'
    
    with open(SITEMAP_FILE, "w", encoding="utf-8") as f:
        f.write(xml_content)
    print(f"Sitemap updated: {len(match_urls)} matches found.")

if __name__ == "__main__":
    matches = get_matches()
    create_sitemap(matches)
