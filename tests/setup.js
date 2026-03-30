// Test setup - create global window object
global.window = global;
global.document = {
  getElementById: jest.fn(),
  createElement: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};
