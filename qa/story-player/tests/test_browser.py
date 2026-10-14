from playwright.sync_api import sync_playwright
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import threading

ROOT=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
passed=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True)
 page=browser.new_page()
 page.set_content((ROOT/'index.html').read_text().replace('<script src="story.js"></script>','').replace('<script src="app.js"></script>',''))
 page.add_style_tag(content=(ROOT/'styles.css').read_text())
 page.add_script_tag(content=(ROOT/'story.js').read_text())
 page.add_script_tag(content=(ROOT/'app.js').read_text())
 assert page.title().startswith('Kindred AAC')
 assert page.locator('#sceneCount').inner_text()=='Scene 1 of 7';passed.append('startup and scene 1 render')
 assert page.locator('#aacPad').is_visible();passed.append('AAC available at start')
 page.locator('[data-say="Help"]').click()
 assert page.locator('#said').inner_text()=='Help'
 assert page.evaluate('kindredQA.getState().interrupted')
 assert page.locator('#sceneCount').inner_text()=='Scene 1 of 7';passed.append('Help interrupts without advancing')
 page.locator('#resumeStory').click()
 page.locator('[data-choice="01-open-door"]').click()
 assert 'Pipkin' in page.locator('#outcome').inner_text()
 assert page.locator('#nextButton').is_visible()
 page.locator('[data-say="Break"]').click()
 assert page.evaluate('kindredQA.getState().interrupted')
 page.locator('#nextButton').click()
 assert page.locator('#sceneCount').inner_text()=='Scene 1 of 7';passed.append('Break stops response advancing')
 page.locator('#resumeStory').click()
 assert page.locator('[data-choice="01-open-door"]').is_enabled();passed.append('Resume restores choice')
 for i,choice in enumerate(['01-ask-whos-there','02-basket','03-stick','04-flower','05-blow','06-apple']):
  page.locator('[data-choice="'+choice+'"]').click()
  assert page.locator('#outcome').is_visible()
  assert page.evaluate('kindredQA.getState().phase')=='response'
  page.locator('#nextButton').click()
  assert page.evaluate('kindredQA.getState().scene')==i+2
 passed.append('six choices and manual progress through all scenes')
 page.locator('[data-choice="07-goodbye"]').click()
 assert 'Goodbye' in page.locator('#outcome').inner_text()
 page.locator('#nextButton').click()
 assert page.evaluate('kindredQA.getState().scene')==1;passed.append('goodbye and replay')
 for i in range(6):
  page.locator('#continueButton').click()
  assert page.evaluate('kindredQA.getState().scene')==i+2
 passed.append('Continue skips choices')
 page.locator('[data-choice="07-restart"]').click()
 assert page.evaluate('kindredQA.getState().scene')==1;passed.append('Read again restart')
 page.locator('#playButton').click()
 page.wait_for_timeout(500)
 assert 'unavailable' in page.locator('#audioState').inner_text().lower()
 passed.append('missing MP3 warning without robotic fallback')
 page.locator('#aacToggle').click()
 assert page.locator('#aacPad').is_visible()
 assert page.locator('[data-say="Help"]').evaluate('(e) => e === document.activeElement');passed.append('AAC pad available and focusable')
 page.set_viewport_size({'width':375,'height':812})
 assert page.locator('[data-say="Stop"]').is_visible()
 page.locator('[data-say="Stop"]').click()
 assert page.locator('#said').inner_text()=='Stop';passed.append('mobile viewport and Stop')
 browser.close()
server.shutdown()
print(f'PASS: {len(passed)} browser checks')
for name in passed:print(' -',name)
