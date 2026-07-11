const cmdShim = require('cmd-shim');
cmdShim('bin/noorcode', 'noorcode-test').then(() => console.log('Shim created!'));
