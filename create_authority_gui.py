import tkinter as tk
from tkinter import messagebox
import requests
import json
import ssl

# Your backend server URL (must be HTTPS)
SERVER_URL = "https://100.76.187.58:3000/api/auth/signup/authority"

def create_authority_user():
    """Sends a POST request to the server to create a new authority user."""
    email = email_entry.get()
    password = password_entry.get()
    authority_name = name_entry.get()
    organization = org_entry.get()
    authority_id = id_entry.get()

    if not all([email, password, authority_name, organization, authority_id]):
        messagebox.showerror("Error", "All fields are required.")
        return

    payload = {
        "email": email,
        "password": password,
        "authority_name": authority_name,
        "organization": organization,
        "authority_id": authority_id
    }

    try:
        # We need to disable SSL verification because the server uses a self-signed certificate.
        # THIS IS NOT SECURE FOR PRODUCTION.
        response = requests.post(SERVER_URL, json=payload, verify=False)

        if response.status_code == 201:
            messagebox.showinfo("Success", "Authority user created successfully!")
            clear_entries()
        else:
            messagebox.showerror("Error", f"Failed to create user. Server responded with: {response.text}")

    except requests.exceptions.RequestException as e:
        messagebox.showerror("Connection Error", f"Could not connect to the server: {e}")

def clear_entries():
    """Clears the input fields in the GUI."""
    email_entry.delete(0, tk.END)
    password_entry.delete(0, tk.END)
    name_entry.delete(0, tk.END)
    org_entry.delete(0, tk.END)
    id_entry.delete(0, tk.END)

# Set up the main window
root = tk.Tk()
root.title("Create Authority User")
root.geometry("400x300")
root.config(bg="#f0f2f5")

# Create and place labels and entries
tk.Label(root, text="Email:", bg="#f0f2f5").grid(row=0, column=0, padx=10, pady=5, sticky="e")
email_entry = tk.Entry(root, width=30)
email_entry.grid(row=0, column=1, padx=10, pady=5)

tk.Label(root, text="Password:", bg="#f0f2f5").grid(row=1, column=0, padx=10, pady=5, sticky="e")
password_entry = tk.Entry(root, width=30, show="*")
password_entry.grid(row=1, column=1, padx=10, pady=5)

tk.Label(root, text="Name:", bg="#f0f2f5").grid(row=2, column=0, padx=10, pady=5, sticky="e")
name_entry = tk.Entry(root, width=30)
name_entry.grid(row=2, column=1, padx=10, pady=5)

tk.Label(root, text="Organization:", bg="#f0f2f5").grid(row=3, column=0, padx=10, pady=5, sticky="e")
org_entry = tk.Entry(root, width=30)
org_entry.grid(row=3, column=1, padx=10, pady=5)

tk.Label(root, text="Authority ID:", bg="#f0f2f5").grid(row=4, column=0, padx=10, pady=5, sticky="e")
id_entry = tk.Entry(root, width=30)
id_entry.grid(row=4, column=1, padx=10, pady=5)

# Create and place the button
create_button = tk.Button(root, text="Create User", command=create_authority_user, bg="#007bff", fg="white")
create_button.grid(row=5, column=0, columnspan=2, pady=20)

# Start the GUI event loop
root.mainloop()