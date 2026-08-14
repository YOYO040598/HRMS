import urllib.request
import urllib.error
import json

test_accounts = [
    ('admin1', 'admin1', 'Admin Tab / Admin Portal'),
    ('admin1@hrms.com', 'admin12345!', 'Admin Tab / Admin Portal'),
    ('empy1', 'employee1', 'Employee Tab / Employee Portal'),
    ('empy1@hrms.com', 'employee12345!', 'Employee Tab / Employee Portal'),
    ('admin@hrms.com', 'password123', 'Admin Tab / Admin Portal'),
    ('employee@hrms.com', 'password123', 'Employee Tab / Employee Portal'),
    ('hr@hrms.com', 'password123', 'Admin Tab / HR Portal'),
    ('manager@hrms.com', 'password123', 'Admin Tab / Manager Portal'),
]

print("==================================================")
print("     LIVE RENDER SERVER AUTHENTICATION AUDIT      ")
print("==================================================")

url = 'https://hrms-1-onby.onrender.com/api/accounts/login/'

for identifier, password, portal in test_accounts:
    data = json.dumps({'email': identifier, 'password': password}).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        body = json.loads(res.read().decode('utf-8'))
        user_role = body.get('data', {}).get('user', {}).get('role', 'UNKNOWN')
        print(f"[SUCCESS 200 OK] {identifier} / {password} | Role: {user_role} -> {portal}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[FAILED {e.code}] {identifier} / {password} | Error: {err_body[:80]}")
    except Exception as e:
        print(f"[EXCEPTION] {identifier} / {password} | Error: {e}")

print("==================================================")
