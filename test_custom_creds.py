import urllib.request
import urllib.error
import json

def test_login(username, password):
    url = 'https://hrms-1-onby.onrender.com/api/accounts/login/'
    data = json.dumps({'email': username, 'password': password}).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        print(f"SUCCESS [{username}]:", res.getcode(), res.read().decode('utf-8')[:120])
    except urllib.error.HTTPError as e:
        print(f"ERROR [{username}]:", e.code, e.read().decode('utf-8'))

test_login('admin1@hrms.com', 'admin12345!')
test_login('empy1@hrms.com', 'employee12345!')
