name: coherent
type: framework
version: 3.0.0
notice: src/NOTICE
export: true
globals: window, document, String, Object, Function, Date, Array, RegExp
output folder: build

# bootstrap: false
# output: build/$(mode)
# validate: true
# mode: debug
# generate docs: true

source:
  - src/foundation.js
  - src/foundation
  - src/external/sizzle.js
  - src/ui.js
  - src/ui
  - src/model.js
  - src/model

  - src/css/toolbar.css
  - src/css/animation.css
  - src/css/layouts.css
