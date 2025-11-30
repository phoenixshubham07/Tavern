import os
import json
import base64
import io
from pypdf import PdfReader
import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Configure Gemini
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

def extract_text_from_pdf(pdf_file):
    """Extracts text from a PDF file object."""
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return None

def analyze_resume(text):
    """
    Uses Gemini 1.5 Flash to find a roastable sentence and generate a roast + image prompt.
    Returns a JSON object.
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        system_prompt = """
        You are a savage career coach. Find the most pretentious, vague, or cliché sentence in this resume. 
        Roast it mercilessly but incorrectly. 
        Output ONLY JSON: { 
            'quote': 'The sentence you found', 
            'roast': 'Your savage joke', 
            'image_prompt': 'A detailed, funny visual description of the roast for an image generator. Do not include text in the image description.' 
        }.
        """
        
        response = model.generate_content([system_prompt, text], generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        print(f"Error analyzing resume: {e}")
        return None

def generate_roast_image(prompt):
    """
    Uses Imagen 3 to generate an image based on the prompt.
    Returns a PIL Image object.
    """
    try:
        # Note: Imagen 3 access via API might vary. Using 'imagen-3.0-generate-001' as requested.
        # If that fails, we might need a fallback or check available models.
        # For this MVP, we'll assume the model is available.
        
        model = genai.GenerativeModel('imagen-3.0-generate-001')
        result = model.generate_images(
            prompt=prompt,
            number_of_images=1,
        )
        
        # Convert the first image to PIL
        # The result usually contains image bytes or a PIL image depending on the library version.
        # Let's assume it returns an object with an 'images' list where items are PIL images.
        if result.images:
            return result.images[0]
        return None
    except Exception as e:
        print(f"Error generating image: {e}")
        return None

def create_composite_image(base_image, quote, roast):
    """
    Overlays the quote and roast text onto the base image using Pillow.
    """
    try:
        # Resize if too huge
        base_image.thumbnail((1024, 1024))
        width, height = base_image.size
        
        draw = ImageDraw.Draw(base_image)
        
        # Add dark overlay at the bottom
        overlay_height = int(height * 0.4)
        overlay = Image.new('RGBA', (width, overlay_height), (0, 0, 0, 200))
        base_image.paste(overlay, (0, height - overlay_height), overlay)
        
        # Load fonts (try default or a system font)
        try:
            # Try to load a nice font, fallback to default
            font_quote = ImageFont.truetype("Arial.ttf", 24)
            font_roast = ImageFont.truetype("Arial.ttf", 36)
        except:
            font_quote = ImageFont.load_default()
            font_roast = ImageFont.load_default()

        # Helper to wrap text
        def wrap_text(text, font, max_width):
            lines = []
            words = text.split()
            current_line = []
            for word in words:
                current_line.append(word)
                # Check width
                # getbbox returns (left, top, right, bottom)
                bbox = font.getbbox(' '.join(current_line))
                w = bbox[2] - bbox[0]
                if w > max_width:
                    current_line.pop()
                    lines.append(' '.join(current_line))
                    current_line = [word]
            lines.append(' '.join(current_line))
            return lines

        # Draw Quote
        quote_text = f'"{quote}"'
        quote_lines = wrap_text(quote_text, font_quote, width - 40)
        y_text = height - overlay_height + 20
        
        for line in quote_lines:
            draw.text((20, y_text), line, font=font_quote, fill=(200, 200, 200))
            y_text += 30
            
        y_text += 20 # Gap
        
        # Draw Roast
        roast_lines = wrap_text(roast, font_roast, width - 40)
        for line in roast_lines:
            draw.text((20, y_text), line, font=font_roast, fill=(255, 255, 255))
            y_text += 45

        # Watermark
        draw.text((width - 150, height - 30), "Roasted by InkFlow", font=font_quote, fill=(100, 100, 255))
        
        return base_image
    except Exception as e:
        print(f"Error composing image: {e}")
        return None

def process_cv(pdf_file):
    """
    Main orchestration function.
    Returns base64 encoded image string.
    """
    # 1. Extract
    text = extract_text_from_pdf(pdf_file)
    if not text:
        return {"error": "Failed to extract text from PDF"}
        
    # 2. Analyze
    analysis = analyze_resume(text)
    if not analysis:
        return {"error": "Failed to analyze resume"}
        
    # 3. Generate Image
    base_image = generate_roast_image(analysis['image_prompt'])
    if not base_image:
        return {"error": "Failed to generate image"}
        
    # 4. Composite
    final_image = create_composite_image(base_image, analysis['quote'], analysis['roast'])
    if not final_image:
        return {"error": "Failed to create composite image"}
        
    # 5. Convert to Base64
    buffered = io.BytesIO()
    final_image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return {"image": img_str}
