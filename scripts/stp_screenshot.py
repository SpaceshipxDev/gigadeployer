import sys
import os
import json


os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")


try:
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Display.SimpleGui import init_display
except Exception:
    print('Required modules not available', file=sys.stderr)
    sys.exit(1)

if len(sys.argv) < 3:
    print('Usage: stp_screenshot.py input.stp outdir', file=sys.stderr)
    sys.exit(1)

inp, outdir = sys.argv[1], sys.argv[2]



    print('Usage: stp_screenshot.py input.stp output.png', file=sys.stderr)
    sys.exit(1)

inp, outp = sys.argv[1], sys.argv[2]


reader = STEPControl_Reader()
reader.ReadFile(inp)
reader.TransferRoots()

display, start_display, add_menu, add_function_to_menu = init_display()

names = []
for i in range(1, reader.NbShapes() + 1):
    shape = reader.Shape(i)
    display.EraseAll()
    display.DisplayShape(shape)
    display.View_Iso()
    display.FitAll()
    name = f"{os.path.splitext(os.path.basename(inp))[0]}_{i}.png"
    path = os.path.join(outdir, name)
    display.backend._display.Export(path)
    names.append(name)

print(json.dumps(names))


shape = reader.OneShape()

display, start_display, add_menu, add_function_to_menu = init_display()

display.DisplayShape(shape)
display.View_Iso()
display.FitAll()
display.backend._display.Export(outp)

