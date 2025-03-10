#! /usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import mimetypes

mimetypes.init()

def mimeTs():
    mimeDict = json.dumps(mimetypes.types_map).replace('", "', '",\n  "').replace('"', "'")
    return 'const dict: { [ext: string]: string } = {\n  ' + mimeDict[1:-1] + '\n};\n\nexport default dict;\n'

def genMimeFile(fileName = 'mime.ts'):
    str = mimeTs()
    fp = open(fileName, 'w+')
    fp.write(str)
    fp.close()

def _printHelp():
    print('usage: %s fileName.ts' % sys.argv[0])

def _main(argc: int, argv = None) -> None:
    if argv is None or 2 != argc:
        return _printHelp()
    genMimeFile(argv[1])

if __name__ == '__main__':
    _main(len(sys.argv), sys.argv)
