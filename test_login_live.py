import urllib.request
import urllib.error
import json

def test_login(email, password):
    url = 'https://hrms-1-onby.onrender.com/api/accounts/login/'
    data = json.dumps({'email': email, 'password': password}).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        print(f"MAIN LOGIN SUCCESS ({email}):", res.getcode(), res.read().decode('utf-8')[:150])
    except urllib.error.HTTPError as e:
        print(f"MAIN LOGIN ERROR ({email}):", e.code, e.read().decode('utf-8'))

test_login('admin@hrms.com', 'HrmsAdmin@2026!')
test_login('employee@hrms.com', 'HrmsEmployee@2026!')
