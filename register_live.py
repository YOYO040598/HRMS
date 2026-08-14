import urllib.request
import urllib.error
import json

url = 'https://hrms-1-onby.onrender.com/api/accounts/register/'
data = json.dumps({
    'email': 'admin@hrms.com',
    'first_name': 'Admin',
    'last_name': 'User',
    'password': 'HrmsAdmin@2026!',
    'password_confirm': 'HrmsAdmin@2026!'
}).encode('utf-8')
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(url, data=data, headers=headers)

try:
    res = urllib.request.urlopen(req)
    print("SUCCESS CODE:", res.getcode())
    print("SUCCESS BODY:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("ERROR CODE:", e.code)
    print("ERROR BODY:", e.read().decode('utf-8'))
