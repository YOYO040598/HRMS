import urllib.request
import urllib.error
import json

def register_custom(email, password, first_name, last_name):
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
        print(f"REGISTER SUCCESS [{email}]:", res.getcode(), res.read().decode('utf-8')[:120])
    except urllib.error.HTTPError as e:
        print(f"REGISTER RESPONSE [{email}]:", e.code, e.read().decode('utf-8'))

register_custom('admin1@hrms.com', 'admin12345!', 'Admin', 'One')
register_custom('empy1@hrms.com', 'employee12345!', 'Employee', 'One')
