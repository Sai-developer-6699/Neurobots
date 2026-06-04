import urllib.request
import json
import urllib.error

url = 'http://127.0.0.1:8000/api/question/51/skip/'
req = urllib.request.Request(url, method='POST')
req.add_header('Content-Type', 'application/json')
# We need a token. We can skip auth if we modify the view or just fetch user 1 and simulate.
# But since I know I already modified views.py to return 500 WITH traceback:
try:
    with urllib.request.urlopen(req) as response:
        print(response.read())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Response body:", e.read().decode('utf-8'))
