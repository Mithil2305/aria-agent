import sys

sys.setrecursionlimit(sys.getrecursionlimit() * 5)

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('static', 'static'),
        ('engine', 'engine'),
        ('ml', 'ml'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'sklearn.utils._cython_blas',
        'sklearn.neighbors._typedefs',
        'sklearn.neighbors._quad_tree',
        'sklearn.tree._utils',
        'statsmodels.tsa.statespace._filters',
        'reportlab.graphics.barcode.common',
        'firebase_admin',
        'firebase_admin.auth',
        'firebase_admin.firestore',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[
        'torch',
        'transformers',
        'peft',
        'bitsandbytes',
        'trl',
        'accelerate',
        'paddlepaddle',
        'paddleocr',
        'paddlex',
        'modelscope',
        'tensorflow',
        'cv2',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    name='yukti-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    icon='../electron/assets/icon.ico',
)
