import urllib.request
import urllib.error
import json

def test_endpoint(endpoint, payload):
    url = f'https://hrms-1-onby.onrender.com/api/accounts/{endpoint}/'
    data = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        print(f"[{endpoint}] SUCCESS ({payload}): STATUS", res.getcode(), res.read().decode('utf-8')[:120])
    except urllib.error.HTTPError as e:
        print(f"[{endpoint}] ERROR ({payload}): STATUS", e.code, e.read().decode('utf-8'))

print("--- TESTING MAIN LOGIN ENDPOINT ---")
test_endpoint('login', {'email': 'admin@hrms.com', 'password': 'HrmsAdmin@2026!'})
test_endpoint('login', {'email': 'employee@hrms.com', 'password': 'HrmsEmployee@2026!'})

print("\n--- TESTING EMPLOYEE LOGIN ENDPOINT ---")
test_endpoint('employee-login', {'employee_id': 'EMP001', 'password': 'password123'})
test_endpoint('employee-login', {'employee_id': 'employee@hrms.com', 'password': 'HrmsEmployee@2026!'})
