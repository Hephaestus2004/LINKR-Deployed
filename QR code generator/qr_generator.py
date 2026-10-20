import qrcode
from PIL import Image, ImageDraw

def create_styled_qr(data: str, logo_path: str, filename: str = "styled_qr.png"):
    # 1. Generate QR code with high error correction (essential for logo coverage)
    qr = qrcode.QRCode(
        version=5,  # Version 5 provides a balanced grid size
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # ~30% error correction
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create base image in RGB
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    draw = ImageDraw.Draw(img)
    
    width, height = img.size
    box_size = 10
    border = 4 * box_size
    eye_size = 7 * box_size  # Standard finder patterns are 7x7 modules

    # 2. Function to draw custom rounded finder patterns (the "eyes")
    def draw_rounded_eye(x, y, size):
        # Clear the default sharp finder pattern area with white
        draw.rectangle([x, y, x + size, y + size], fill="white")
        
        # Outer rounded box border
        draw.rounded_rectangle([x, y, x + size, y + size], radius=22, outline="black", width=box_size)
        
        # Inner solid rounded square
        inner_size = size - (4 * box_size)
        inner_x = x + (2 * box_size)
        inner_y = y + (2 * box_size)
        draw.rounded_rectangle([inner_x, inner_y, inner_x + inner_size, inner_y + inner_size], radius=10, fill="black")

    # Draw the three corner finder patterns (Top-Left, Top-Right, Bottom-Left)
    draw_rounded_eye(border, border, eye_size)
    draw_rounded_eye(width - border - eye_size, border, eye_size)
    draw_rounded_eye(border, height - border - eye_size, eye_size)

    # 3. Add Center Logo with a solid background container
    try:
        logo = Image.open(logo_path)
        max_logo_size = width // 4
        logo.thumbnail((max_logo_size, max_logo_size), Image.Resampling.LANCZOS)
        
        logo_w, logo_h = logo.size
        container_size = max_logo_size + 24  # Padding around the logo
        c_x = (width - container_size) // 2
        c_y = (height - container_size) // 2
        
        # Draw the solid dark background container for the logo
        draw.rounded_rectangle([c_x, c_y, c_x + container_size, c_y + container_size], radius=12, fill="black")
        
        # Paste the logo centered inside the container
        p_x = c_x + (container_size - logo_w) // 2
        p_y = c_y + (container_size - logo_h) // 2
        img.paste(logo, (p_x, p_y), logo if logo.mode == 'RGBA' else None)
        
    except FileNotFoundError:
        print(f"Warning: Logo file '{logo_path}' not found. Generating QR code with rounded eyes only.")

    # 4. Save the final styled image
    img.save(filename)
    print(f"Styled QR code successfully saved as {filename}")

if __name__ == "__main__":
    target_url = "https://linkr-founder.vercel.app/"
    my_logo = "logo.png"  # Path to your logo file
    create_styled_qr(target_url, my_logo, "qr_output.png")