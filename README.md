# ViewDom.js

Interactive tree view of a dom node, useful for debugging html rich editors

# Description
  ViewDom renders a tree representation of a given DOM node.  The current cursor position and any selection will also be rendered.

### Quick start
  * Clone the repo: `git clone https://github.com/natejenkins/view-dom.git`
  * Install with [npm](https://www.npmjs.com/package/view-dom): `npm install view-dom`

  In the browser:

  ```html
  <script src="/path/to/view_dom.js"></script>
  <script>
    var vd = new ViewDom(sourceDomNode, renderNode)
  </script>
  ```

  As a dependency:

  ```javascript
  import {ViewDom} from 'view-dom'
  ```


### Usage

The graphical tree view shows the contents of the editor. The current cursor position is shown as a vertical bar in the respective tree node.

* Colors

A green rectangle around a node signifies that the current selection range start is somewhere inside the node. A green link signifies the current selection range start points at the child node. A red rectangle or link signifies the end of a selection. If a rectangle or link is purple, it signifies both the start and end of the current selection.

* Setting the selection via the tree view

You can click on any node or link in the tree view to set the start of the current selection and that position will be reflected in the editor. Holding down ctrl or shift while clicking will set the selection end.

* Zero-width characters

Zero-width characters will show up as a * in the tree view. This can be configured when setting up ViewDom.