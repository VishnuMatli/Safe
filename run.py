import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import webbrowser
import os
import re
import threading

class AppGUI:
    def __init__(self, master):
        self.master = master
        master.title("Application Control Panel")
        master.geometry("400x300")
        master.configure(bg="#2c3e50")

        self.server_process = None
        self.server_url = None

        self.style = ttk.Style()
        self.style.configure("TFrame", background="#2c3e50")
        self.style.configure("TButton", font=("Helvetica", 12, "bold"), padding=10, relief="flat", background="#34495e", foreground="white")
        self.style.map("TButton", background=[("active", "#4a6984")])
        self.style.configure("TLabel", background="#2c3e50", foreground="#ecf0f1", font=("Helvetica", 10))

        main_frame = ttk.Frame(master, padding="20")
        main_frame.pack(expand=True, fill="both")

        self.server_button = self.create_circular_button(main_frame, "Start Server", self.toggle_server, "green")
        self.server_button.pack(pady=20)

        self.url_label = ttk.Label(main_frame, text="Server URL: Not running")
        self.url_label.pack(pady=10)

        self.web_app_button = ttk.Button(main_frame, text="Open Web Application", command=self.open_web_app, state=tk.DISABLED)
        self.web_app_button.pack(pady=5)

        ttk.Separator(main_frame, orient="horizontal").pack(fill="x", pady=15)

        self.authority_button = ttk.Button(main_frame, text="Open Authority User Creator", command=self.open_authority_program)
        self.authority_button.pack(pady=5)

    def create_circular_button(self, parent, text, command, color):
        canvas = tk.Canvas(parent, width=100, height=100, bg="#2c3e50", highlightthickness=0)
        canvas.pack()
        
        button_id = canvas.create_oval(10, 10, 90, 90, fill=color, outline=color)
        text_id = canvas.create_text(50, 50, text=text, fill="white", font=("Helvetica", 10, "bold"), justify="center")

        def on_click(event):
            command()

        canvas.tag_bind(button_id, "<Button-1>", on_click)
        canvas.tag_bind(text_id, "<Button-1>", on_click)
        canvas.configure(cursor="hand2")
        return canvas

    def toggle_server(self):
        if self.server_process is None:
            self.start_server()
        else:
            self.stop_server()

    def start_server(self):
        self.url_label.config(text="Server URL: Starting...")
        self.server_button.itemconfig(1, fill="orange")
        self.server_button.itemconfig(2, text="Stopping...")
        
        threading.Thread(target=self._run_server_process).start()

    def _run_server_process(self):
        try:
            self.server_process = subprocess.Popen(
                ["node", "server.js"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )

            for line in self.server_process.stdout:
                print(line, end="")
                if "Server running at" in line:
                    match = re.search(r'https://(\S+:\d+)', line)
                    if match:
                        self.server_url = match.group(1)
                        self.master.after(0, self.update_gui_on_start)
                        break
            self.server_process.wait()

            self.master.after(0, self.update_gui_on_stop)

        except FileNotFoundError:
            self.master.after(0, lambda: messagebox.showerror("Error", "Node.js or server.js not found. Make sure they are in your PATH."))
            self.master.after(0, self.update_gui_on_stop)

    def update_gui_on_start(self):
        self.url_label.config(text=f"Server URL: {self.server_url}")
        self.web_app_button.config(state=tk.NORMAL)
        self.server_button.itemconfig(1, fill="red")
        self.server_button.itemconfig(2, text="Stop Server")

    def update_gui_on_stop(self):
        self.server_process = None
        self.server_url = None
        self.url_label.config(text="Server URL: Not running")
        self.web_app_button.config(state=tk.DISABLED)
        self.server_button.itemconfig(1, fill="green")
        self.server_button.itemconfig(2, text="Start Server")
        
    def stop_server(self):
        if self.server_process:
            self.server_process.terminate()
            self.server_process = None

    def open_web_app(self):
        if self.server_url:
            webbrowser.open_new_tab(f"https://{self.server_url}")
        else:
            messagebox.showinfo("Info", "Server is not running.")

    def open_authority_program(self):
        try:
            subprocess.Popen(["python", "create_authority_gui.py"])
        except FileNotFoundError:
            messagebox.showerror("Error", "create_authority_gui.py not found. Make sure the file exists.")

root = tk.Tk()
app = AppGUI(root)
root.mainloop()