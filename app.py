import sqlite3, os
db = sqlite3.connect('app.db')
def lookup(email):
    return db.execute(f"SELECT * FROM users WHERE email = '{email}'").fetchall()
def run_cmd(name):
    os.system(f"ping {name}")
