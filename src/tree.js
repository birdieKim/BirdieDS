var TreeNode = require('./treeNode');
var Queue = require('./queue');
var Stack = require('./stack');

/**
 *
 * Create the tree
 *
 * @param {*} data
 *   Data of the node to be root
 *
 * @param {Number} num
 *   The maximum number of children that a node can hold
 *
 * @param {Function} equalFunc
 *   A Function for checking equality of the data
 *   This function has a node for comparison as parameters
 */
var Tree = function(data, num, equalFunc) {
  var node = new TreeNode(data);
  this._root = node;
  this._maxChildrenNum = num;
  this._equal = equalFunc === undefined ? function(a, b) { if(a === b) { return true; } else { return false; } } : equalFunc;
};

var _eventCallbacks = {};
var _canvasObjects = [];

Tree.prototype.addEventListener = function(eventName, callback) {
  // prevent unkown eventName
  if (_eventCallbacks[eventName] === undefined) {
    _eventCallbacks[eventName] = [];
  }

  _eventCallbacks[eventName].push(callback);
}


Tree.prototype.visualize = function(canvas) {
  if(!_eventCallbacks.hasOwnProperty('change')) {
    this.addEventListener('change', _draw);
  } else {
    var hasEqualDom = false;
    for(var i = 0; i < _canvasObjects.length; i++) {
      if(_canvasObjects[i].isEqualNode(canvas)) {
        hasEqualDom = true;
      }
    }
    if(!hasEqualDom) {
      _canvasObjects.push(canvas);
      this.addEventListener('change', _draw);
    }
  }


  function _draw(e) {

    //re-draw
  }
}


Tree.prototype.removeEventListener = function(eventName, callback) {
  var index = _eventCallbacks[eventName].indexOf(callback);

  if (index !== -1) {
      _eventCallbacks[eventName].splice(index, 1);
  }
}

/**
 *
 * Traverse the tree nodes
 *
 * @param {String} [traversal='BF']
 *   There are 2 options:
 *      "BF" - Breadth-first search (default)
 *      "DF" - Depth-first search in pre-order traversal
 * @param {Function} [func]
 *   A function invoked during traversal
 *   This function has a node as a parameter
 *   If the function returns true, traverse will stop
 *
 * @return {Array|undefined}
 *   An array for nodes in order by the traversal
 *   Return undefined, if the traversal is neither 'BF' nor 'DF'
 */
Tree.prototype.traverse = function(traversal, func) {
  var order = []; // an array for nodes in order by the traversal
  if(traversal === 'BF' || traversal === undefined) {
    var queue = new Queue();

    queue.enqueue(this._root);

    while(!queue.isEmpty()) {

      var currentNode = queue.dequeue();

      for(var i = 0; i < currentNode.children.length; i++) {
        queue.enqueue(currentNode.children[i]);
      }

      order.push(currentNode.data);

      if(func) {
        if (func.call(this, currentNode)) {
          break;
        }
      }
    }

    return order;
  } else if(traversal === 'DF') {
    var stack = new Stack();
    stack.push(this._root);

    while(!stack.isEmpty()) {
      var currentNode = stack.pop();
      for(var i = currentNode.children.length-1; i >= 0; i--) {
        stack.push(currentNode.children[i]);
      }

      order.push(currentNode.data);

      if(func){
        if (func.call(this, currentNode)) {
          break;
        }
      }
    }

    return order;
  } else {
    console.warn('The traversal passed in does not exist.');
  }
};


/**
 *
 * Insert a node to the given parent node
 * It inserts a node with the given data to the first found parent node with the given parent data
 *
 * @param {*} data
 *   The data of the node to be inserted
 *
 * @param {*} parentData
 *   The data of the node which will be a parent of the inserted node
 *
 * @param {String} [traversal='BF']
 *   There are 2 options:
 *      "BF" - Breadth-first search
 *      "DF" - Depth-first search in pre-order traversal
 *   If this parameter is undefined, the traversal will be 'BF' as a default
 */
Tree.prototype.insert = function(data, parentData, traversal) {
  var child = new TreeNode(data);
  var parent;

  traversal = traversal === undefined ? 'BF' : traversal;
  this.traverse(traversal, _findParent);

  if(parent) {
    if(this._maxChildrenNum && parent.children.length >= this._maxChildrenNum) {
      console.warn('The parent node already has enough children.');
    } else {
      parent.children.push(child);
      child.parent = parent;
      if(_eventCallbacks.hasOwnProperty('change')) {
        _eventCallbacks.change.forEach(function(callback) {
          callback({node: child, traversal: traversal, triggeredBy: 'insert'});
        });
      }
    }
  } else {
    console.warn('Could not find the parent node with the given data.');
  }

  function _findParent(currentNode) {
    if(this._equal(parentData, currentNode.data)) {
      parent = currentNode;
      return true;
    }
  }

};


/**
 *
 * Delete a node which is the child of the parent node with the given parentData
 * It deletes a node with the given data to the first found parent node with the given parent data
 *
 * @param {*} data
 *   The data of the node to be deleted
 *
 * @param {*} parentData
 *   The data of the node which is a parent of the deleted node
 *
 * @param {String} [traversal='BF']
 *   There are 2 options:
 *      "BF" - Breadth-first search
 *      "DF" - Depth-first search in pre-order traversal
 *   If this parameter is undefined, the traversal will be 'BF' as a default
 */
Tree.prototype.delete = function(data, parentData, traversal) {
  var childIndex;
  var parent;

  traversal = traversal === undefined ? 'BF' : traversal;
  this.traverse(traversal, _findParent);

  if(parent) {
    for(var i = 0 ; i < parent.children.length; i++) {
      if(this._equal(data, parent.children[i].data)) {
        if(_eventCallbacks.hasOwnProperty('change')) {
          _eventCallbacks.change.forEach(function(callback) {
            callback({node: parent.children[i], traversal: traversal, triggeredBy: 'delete'});
          });
        }
        parent.children[i].parent = null;
        parent.children.splice(i, 1);
        childIndex = i;
        break;
      }
    }
    if(childIndex === undefined){
      console.warn('Could not find the child node with the given data.');
    }
  } else {
    console.warn('Could not find the parent node with the given data.');
  }

  function _findParent(currentNode) {
    if(this._equal(parentData, currentNode.data)) {
      parent = currentNode;
      return true;
    }
  }
};


/**
 *
 * Check if the tree is empty
 *
 * @return {Boolean}
 *   Boolean for whether the data object is empty or not
 */
Tree.prototype.isEmpty = function() {
  if(this._root === undefined){
    return true;
  } else {
    return false;
  }
};


/**
 *
 * Make the tree empty
 *
 */
Tree.prototype.clear = function() {
  this._root.children.length = 0;
  this._root = undefined;

  if(_eventCallbacks.hasOwnProperty('change')) {
    _eventCallbacks.change.forEach(function(callback) {
      callback({triggeredBy: 'clear'});
    });
  }
};


/**
 *
 * Add a node to the root
 *
 * @param {*} data
 *   The data of the node to be root
 *
 */
Tree.prototype.addToRoot = function(data) {
  var root = new TreeNode(data);
  if(this.isEmpty()){
    this._root = root;
  } else {
    root.children.push(this._root);
    this._root.parent = root;
    this._root = root;
  }
  if(_eventCallbacks.hasOwnProperty('change')) {
    _eventCallbacks.change.forEach(function(callback) {
      callback({triggeredBy: 'addToRoot'});
    });
  }
};







module.exports = Tree;
