@echo off
echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Downloading fashion images...
python download_fashion_images.py

echo.
echo Press any key to exit...
pause > nul
