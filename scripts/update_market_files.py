import re
import os

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scripts_dir = os.path.join(workspace_root, 'scripts')

with open(os.path.join(scripts_dir, 'products_data.js'), 'r', encoding='utf-8') as f:
    js_products_code = f.read()

with open(os.path.join(scripts_dir, 'products_data.ts'), 'r', encoding='utf-8') as f:
    ts_products_code = f.read()

# 1. Update js/market.js
market_js_path = os.path.join(workspace_root, 'js', 'market.js')
with open(market_js_path, 'r', encoding='utf-8') as f:
    market_js = f.read()

# Replace PRODUCTS_DATA array
pattern_products = r'const PRODUCTS_DATA = \[[\s\S]*?\n\];'
if re.search(pattern_products, market_js):
    market_js = re.sub(pattern_products, js_products_code, market_js, count=1)
    print("Replaced PRODUCTS_DATA in js/market.js")
else:
    print("WARNING: Could not find PRODUCTS_DATA in js/market.js")

# Update openAuthModal and closeAuthModal
open_auth_old = """function openAuthModal(mode = 'register') {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
  switchAuthTab(mode);
}"""

open_auth_new = """function openAuthModal(mode = 'register') {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
  if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
  switchAuthTab(mode);
}"""

close_auth_old = """function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOpen = cartDrawer && !cartDrawer.classList.contains('pointer-events-none') && document.getElementById('cart-panel') && !document.getElementById('cart-panel').classList.contains('translate-x-full');
  if (!cartOpen) {
    document.body.classList.remove('modal-open');
    if (typeof window.resumeHeroSliderFromModal === 'function') window.resumeHeroSliderFromModal();
  }
}"""

close_auth_new = """function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOpen = cartDrawer && !cartDrawer.classList.contains('pointer-events-none') && document.getElementById('cart-panel') && !document.getElementById('cart-panel').classList.contains('translate-x-full');
  if (!cartOpen) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    if (typeof window.resumeHeroSliderFromModal === 'function') window.resumeHeroSliderFromModal();
  }
}"""

if open_auth_old in market_js:
    market_js = market_js.replace(open_auth_old, open_auth_new)
    print("Updated openAuthModal in js/market.js")

if close_auth_old in market_js:
    market_js = market_js.replace(close_auth_old, close_auth_new)
    print("Updated closeAuthModal in js/market.js")

# Normalize default fallback image
market_js = market_js.replace(
    "return 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg';",
    "return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';"
)

with open(market_js_path, 'w', encoding='utf-8') as f:
    f.write(market_js)

# 2. Update src/components/market/MarketGrid.tsx
market_grid_path = os.path.join(workspace_root, 'src', 'components', 'market', 'MarketGrid.tsx')
with open(market_grid_path, 'r', encoding='utf-8') as f:
    market_grid = f.read()

pattern_ts_products = r'const DEFAULT_MARKET_PRODUCTS: Product\[\] = \[[\s\S]*?\n\];'
if re.search(pattern_ts_products, market_grid):
    market_grid = re.sub(pattern_ts_products, ts_products_code, market_grid, count=1)
    print("Replaced DEFAULT_MARKET_PRODUCTS in MarketGrid.tsx")
    with open(market_grid_path, 'w', encoding='utf-8') as f:
        f.write(market_grid)
else:
    print("WARNING: Could not find DEFAULT_MARKET_PRODUCTS in MarketGrid.tsx")

# 3. Update mercado.html
mercado_path = os.path.join(workspace_root, 'mercado.html')
with open(mercado_path, 'r', encoding='utf-8') as f:
    mercado = f.read()

# Add modal-scroll CSS style in head
scroll_style = """
  <!-- Estilos para scroll fluido en modales -->
  <style>
    .modal-scroll {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f8fafc;
    }
    .modal-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .modal-scroll::-webkit-scrollbar-track {
      background: #f8fafc;
      border-radius: 9999px;
    }
    .modal-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 9999px;
    }
    .modal-scroll::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  </style>
</head>"""

if '</head>' in mercado and '.modal-scroll' not in mercado:
    mercado = mercado.replace('</head>', scroll_style)
    print("Added modal-scroll styles to mercado.html")

# Replace auth-modal structure in mercado.html
old_auth_modal_html = """  <div id="auth-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50" onclick="closeAuthModal()"></div>
    
    <div class="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden z-10 animate-slide-up">"""

new_auth_modal_html = """  <div id="auth-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onclick="if(event.target === this) closeAuthModal()">
    <div class="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl my-auto z-10 animate-slide-up modal-scroll border border-stone-200">"""

if old_auth_modal_html in mercado:
    mercado = mercado.replace(old_auth_modal_html, new_auth_modal_html)
    print("Updated #auth-modal in mercado.html")
else:
    print("WARNING: Could not find exact old_auth_modal_html in mercado.html")

# Also ensure producer-technical-modal in mercado.html has max-h-[90vh] and overflow-y-auto
old_pt_modal = '<div class="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden z-10 animate-slide-up my-auto">'
new_pt_modal = '<div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl my-auto z-10 animate-slide-up modal-scroll border border-stone-200">'
if old_pt_modal in mercado:
    mercado = mercado.replace(old_pt_modal, new_pt_modal)
    print("Updated producer-technical-modal in mercado.html")

with open(mercado_path, 'w', encoding='utf-8') as f:
    f.write(mercado)

# 4. Update index.html
index_path = os.path.join(workspace_root, 'index.html')
with open(index_path, 'r', encoding='utf-8') as f:
    index_html = f.read()

if '</head>' in index_html and '.modal-scroll' not in index_html:
    index_html = index_html.replace('</head>', scroll_style)
    print("Added modal-scroll styles to index.html")

# Update register-auth-modal in index.html
old_reg_modal = """  <div id="register-auth-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
    <div class="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden z-10 animate-slide-up my-auto">"""

new_reg_modal = """  <div id="register-auth-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onclick="if(event.target === this) closeRegisterModal()">
    <div class="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl my-auto z-10 animate-slide-up modal-scroll border border-stone-200">"""

if old_reg_modal in index_html:
    index_html = index_html.replace(old_reg_modal, new_reg_modal)
    print("Updated register-auth-modal in index.html")
else:
    print("WARNING: Could not find exact old_reg_modal in index.html")

# Update login-auth-modal in index.html
old_login_modal = """  <div id="login-auth-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 hidden">
    <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200 animate-slide-up">"""

new_login_modal = """  <div id="login-auth-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onclick="if(event.target === this) closeLoginModal()">
    <div class="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-xl my-auto z-10 animate-slide-up modal-scroll border border-stone-200">"""

if old_login_modal in index_html:
    index_html = index_html.replace(old_login_modal, new_login_modal)
    print("Updated login-auth-modal in index.html")

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Update completed successfully!")
