// Setup default configuration for external npm-packages
import "./src/packages.setup";

// Mock __non_webpack_require__ for tests
(globalThis as any).__non_webpack_require__ = jest.fn();
