from flask import Blueprint, request, jsonify
import mysql.connector

auth_bp = Blueprint("auth", __name__)

# Fallback credentials for mysql
MYSQL_HOST = "localhost"
MYSQL_USER = "root"
MYSQL_PASSWORD = "seedit"
MYSQL_DATABASE = "traffic"

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400

    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
        cursor = conn.cursor(dictionary=True)
        # Assuming the table is named `user` and has columns `username` and `password`
        cursor.execute(
            "SELECT username FROM user WHERE username = %s AND password = %s",
            (username, password)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            return jsonify({"success": True, "user": {"username": user["username"]}})
        else:
            return jsonify({"success": False, "error": "Invalid username or password"}), 401

    except mysql.connector.Error as err:
        print(f"MySQL Error: {err}")
        return jsonify({"success": False, "error": f"Database error: {err}"}), 500
