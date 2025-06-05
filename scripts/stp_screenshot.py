import sys
try:
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Display.SimpleGui import init_display
except Exception:
    print('Required modules not available', file=sys.stderr)
    sys.exit(1)

if len(sys.argv) < 3:
    print('Usage: stp_screenshot.py input.stp output.png', file=sys.stderr)
    sys.exit(1)

inp, outp = sys.argv[1], sys.argv[2]

reader = STEPControl_Reader()
reader.ReadFile(inp)
reader.TransferRoots()
shape = reader.OneShape()

display, start_display, add_menu, add_function_to_menu = init_display()

display.DisplayShape(shape)
display.View_Iso()
display.FitAll()
display.backend._display.Export(outp)
