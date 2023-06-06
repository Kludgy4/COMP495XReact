// ChatGPT result

export class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(tuple) {
    const node = new TreeNode(tuple);
    if (this.root === null) {
      this.root = node;
    } else {
      this.insertNode(this.root, node);
    }
  }

  insertNode(root, node) {
    if (node.tuple[0] < root.tuple[0]) {
      if (root.left === null) {
        root.left = node;
      } else {
        this.insertNode(root.left, node);
      }
    } else {
      if (root.right === null) {
        root.right = node;
      } else {
        this.insertNode(root.right, node);
      }
    }
  }

  search(key) {
    let result = null;
    this.findLargestKey(this.root, key, (node) => {
      result = node.tuple;
    });
    return result;
  }

  findLargestKey(node, key, callback) {
    if (node === null) {
      return;
    }

    if (node.tuple[0] === key) {
      callback(node);
      return;
    }

    if (node.tuple[0] < key) {
      callback(node);
      this.findLargestKey(node.right, key, callback);
    } else {
      this.findLargestKey(node.left, key, callback);
    }
  }

  static fromObject(obj) {
    const bst = new BinarySearchTree();

    // Convert object entries to an array of tuples
    const tuples = Object.entries(obj).map(
      ([breakpointValue, contentWidth]) => {
        return [parseInt(breakpointValue), parseInt(contentWidth)];
      }
    );

    // Sort the tuples by the first element (breakpointValue)
    tuples.sort((a, b) => a[0] - b[0]);

    // Insert the sorted tuples into the binary search tree
    tuples.forEach((tuple) => bst.insert(tuple));

    return bst;
  }
}

export class TreeNode {
  constructor(tuple) {
    this.tuple = tuple;
    this.left = null;
    this.right = null;
  }
}
