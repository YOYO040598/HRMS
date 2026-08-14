import urllib.request
import urllib.error
import json

url = 'https://hrms-1-onby.onrender.com/api/accounts/login/'
data = json.dumps({'email': 'employee@hrms.com', 'password': 'HrmsEmployee@2026!'}).encode('utf-8')
headers = {'Content-Type': 'application/json'}
req = urllib.request.Request(url, data=data, headers=headers)

try:
    res = urllib.request.urlopen(req)
    print("EMPLOYEE SUCCESS:", res.getcode(), res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("EMPLOYEE ERROR:", e.code, e.read().decode('utf-8'))
