import urllib.request
import urllib.error
import json

test_accounts = [
    ('admin@hrms.com', 'HrmsAdmin@2026!', 'ADMIN'),
    ('admin@hrms.com', 'admin12345!', 'ADMIN'),
    ('admin@hrms.com', 'admin1', 'ADMIN'),
    ('admin@hrms.com', 'password123', 'ADMIN'),
    ('admin1@hrms.com', 'admin12345!', 'ADMIN'),
]

url = 'https://hrms-1-onby.onrender.com/api/accounts/login/'

for identifier, password, expected_role in test_accounts:
    data = json.dumps({'email': identifier, 'password': password}).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        body = json.loads(res.read().decode('utf-8'))
        user_role = body.get('data', {}).get('user', {}).get('role', 'UNKNOWN')
        user_email = body.get('data', {}).get('user', {}).get('email', '')
        print(f"[LIVE SUCCESS 200] ID: '{identifier}' | Pass: '{password}' | Returned Email: '{user_email}' | Returned Role: '{user_role}'")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[LIVE FAIL {e.code}] ID: '{identifier}' | Pass: '{password}' | Response Body: {err_body[:80]}")
    except Exception as e:
        print(f"[LIVE EXCEPTION] ID: '{identifier}' | Error: {e}")
