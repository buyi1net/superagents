import sys
from pypdf import PdfReader




reader = PdfReader(sys.argv[1])
if (reader.get_fields()):
    print("此 PDF 有可填写的表单字段")
else:
    print("此 PDF 没有可填写的表单字段；你需要通过视觉判断来定位数据输入位置")
