import urllib.request
import urllib.error
import json

def test_emp_login(emp_id, password):
    url = 'https://hrms-1-onby.onrender.com/api/accounts/employee-login/'
    data = json.dumps({'employee_id': emp_id, 'password': password}).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        print(f"EMPLOYEE LOGIN SUCCESS ({emp_id}):", res.getcode(), res.read().decode('utf-8')[:150])
    except urllib.error.HTTPError as e:
        print(f"EMPLOYEE LOGIN ERROR ({emp_id}):", e.code, e.read().decode('utf-8'))

test_emp_login('employee@hrms.com', 'HrmsEmployee@2026!')
test_emp_login('admin@hrms.com', 'HrmsAdmin@2026!')
