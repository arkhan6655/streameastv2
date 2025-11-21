import requests
import json
import time
import base64
import urllib.parse
from datetime import datetime, timezone

# Configuration
API_URL = "https://topembed.pw/api.php?format=json"
BASE_URL = "https://streameastv2.world" 
SITEMAP_FILE = "sitemap.xml"

# Static pages: Update rarely (set to 1st of current month)
STATIC_PAGES_MONTHLY = ["/About/", "/Terms/", "/Privacy/", "/Disclaimer/", "/DMCA/", "/Contact/"]

# Dynamic Pages: These change ALL the time
PAGES_ALWAYS = ["", "/Schedule/"] 

def get_current_date_str():
    """Returns today's date in YYYY-MM-DD format"""
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')

def get_first_of_month_str():
    """Returns the 1st day of the current month in YYYY-MM-DD format"""
    today = datetime.now(timezone.utc)
    return today.replace(day=1).strftime('%Y-%m-%d')

def generate_id(timestamp, sport, match):
    unique_string = f"{timestamp}_{sport}_{match}"
    encoded_bytes = base64.b64encode(unique_string.encode('utf-8'))
    return encoded_bytes.decode('utf-8')

def get_data():
    try:
        response = requests.get(API_URL, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching API: {e}")
        return None

def create_sitemap():
    data = get_data()
    if not data or 'events' not in data:
        return

    match_urls = []
    sports_categories = set() # Store unique sports
    
    now = int(time.time()) 

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

                # === 1. Collect Categories ===
                # Your JS logic adds categories if they exist in the API
                # We add them to the set to ensure uniqueness
                sports_categories.add(sport)

                # === 2. Filter Matches (Time Logic) ===
                diff_minutes = (now - unix_timestamp) / 60
                sport_lower = sport.lower()

                if sport_lower == 'cricket' and diff_minutes >= 480:
                    continue 
                
                if sport_lower != 'cricket' and diff_minutes >= 180:
                    continue 
                
                unique_id = generate_id(unix_timestamp, sport, match_name)
                url = f"{BASE_URL}/Matchinformation/?id={unique_id}"
                match_urls.append(url)

            except Exception as e:
                continue

    # === XML GENERATION ===
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    current_date = get_current_date_str()
    month_start_date = get_first_of_month_str()

    # 1. Homepage & Schedule (ALWAYS)
    for page in PAGES_ALWAYS:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{BASE_URL}{page}</loc>\n'
        xml_content += f'    <lastmod>{current_date}</lastmod>\n'
        xml_content += '    <changefreq>always</changefreq>\n' 
        xml_content += '    <priority>1.0</priority>\n'
        xml_content += '  </url>\n'

    # 2. Sports Categories (ALWAYS) - Extracted from API
    # URL Format: /Schedule/#/Football
    for sport in sorted(list(sports_categories)):
        # Encode the sport name for URL (e.g., "American Football" -> "American%20Football")
        encoded_sport = urllib.parse.quote(sport)
        cat_url = f"{BASE_URL}/Schedule/#/{encoded_sport}"
        
        # XML requires & to be escaped
        safe_url = cat_url.replace("&", "&amp;")
        
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{safe_url}</loc>\n'
        xml_content += f'    <lastmod>{current_date}</lastmod>\n'
        xml_content += '    <changefreq>always</changefreq>\n'
        xml_content += '    <priority>0.9</priority>\n' # High priority
        xml_content += '  </url>\n'

    # 3. Match Pages (ALWAYS)
    for url in match_urls:
        safe_url = url.replace("&", "&amp;")
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{safe_url}</loc>\n'
        xml_content += f'    <lastmod>{current_date}</lastmod>\n'
        xml_content += '    <changefreq>always</changefreq>\n'
        xml_content += '    <priority>0.8</priority>\n'
        xml_content += '  </url>\n'

    # 4. Static Pages (MONTHLY)
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
    print(f"Sitemap updated: {len(sports_categories)} categories, {len(match_urls)} matches.")

if __name__ == "__main__":
    create_sitemap()
