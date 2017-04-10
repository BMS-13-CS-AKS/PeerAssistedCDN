## log.js

### `var logger = require('./log.js')`

returns `logger` object that can be used for logging

### `logger.INFO(message)`

prints `message` in green color

### `logger.DEBUG(message)`

prints `message` in blue color

### `logger.ERROR(message)`

prints `message` in red color

### `logger.WARN(message)`

prints `message` in magenta color

## random.js

### `require('./random.js')(n)`

returns an array which contains elements between 1 and `n` in random order

## fileUtils.js

### `require('./fileUtils.js')(fileObj)`

fills `fileObj` with additional details :
- number of Pieces
- remaining Pieces
- default block size
- number of blocks
- last piece length
- last block index
- last block size
