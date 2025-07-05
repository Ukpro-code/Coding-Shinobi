from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dashboard.db'
db = SQLAlchemy(app)

@app.route('/')
def home():
    return "<h1>Welcome to Your Productivity Dashboard</h1>"

if __name__ == '__main__':
    app.run(debug=True)