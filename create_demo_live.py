import urllib.request
import urllib.error
import json

def register_user(email, password, first_name, last_name):
    url = 'https://hrms-1-onby.onrender.com/api/accounts/register/'
    data = json.dumps({
        'email': email,
        'first_name': first_name,
        'last_name': last_name,
        'password': password,
        'password_confirm': password
    }).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        print(f"SUCCESS {email}:", res.getcode())
    except urllib.error.HTTPError as e:
        print(f"RESPONSE {email}:", e.code, e.read().decode('utf-8'))

register_user('employee@hrms.com', 'HrmsEmployee@2026!', 'John', 'Doe')
