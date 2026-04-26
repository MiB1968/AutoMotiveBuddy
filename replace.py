import os

def replace_in_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Apply replacements
    content = content.replace('primary-orange', 'brand')
    content = content.replace('orange-dark', 'brand-dark')
    content = content.replace('orange-glow', 'brand-glow')
    content = content.replace('orange', 'brand')
    content = content.replace('bg-brand/50', 'bg-brand/50')
    content = content.replace('bg-brand/20', 'bg-brand/20')
    
    with open(path, 'w') as f:
        f.write(content)

replace_in_file('src/App.tsx')
replace_in_file('src/index.css')
print("Replaced successfully")
