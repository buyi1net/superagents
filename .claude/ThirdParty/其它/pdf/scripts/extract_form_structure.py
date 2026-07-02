"""
从不可填写的 PDF 中提取表单结构。

此脚本分析 PDF 以查找：
- 文本标签及其精确坐标
- 水平线（行边界）
- 复选框（小矩形）

输出：一个 JSON 文件，包含可用于生成精确填写坐标的表单结构。

用法：python extract_form_structure.py <input.pdf> <output.json>
"""

import json
import sys
import pdfplumber


def extract_form_structure(pdf_path):
    structure = {
        "pages": [],
        "labels": [],
        "lines": [],
        "checkboxes": [],
        "row_boundaries": []
    }

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            structure["pages"].append({
                "page_number": page_num,
                "width": float(page.width),
                "height": float(page.height)
            })

            words = page.extract_words()
            for word in words:
                structure["labels"].append({
                    "page": page_num,
                    "text": word["text"],
                    "x0": round(float(word["x0"]), 1),
                    "top": round(float(word["top"]), 1),
                    "x1": round(float(word["x1"]), 1),
                    "bottom": round(float(word["bottom"]), 1)
                })

            for line in page.lines:
                if abs(float(line["x1"]) - float(line["x0"])) > page.width * 0.5:
                    structure["lines"].append({
                        "page": page_num,
                        "y": round(float(line["top"]), 1),
                        "x0": round(float(line["x0"]), 1),
                        "x1": round(float(line["x1"]), 1)
                    })

            for rect in page.rects:
                width = float(rect["x1"]) - float(rect["x0"])
                height = float(rect["bottom"]) - float(rect["top"])
                if 5 <= width <= 15 and 5 <= height <= 15 and abs(width - height) < 2:
                    structure["checkboxes"].append({
                        "page": page_num,
                        "x0": round(float(rect["x0"]), 1),
                        "top": round(float(rect["top"]), 1),
                        "x1": round(float(rect["x1"]), 1),
                        "bottom": round(float(rect["bottom"]), 1),
                        "center_x": round((float(rect["x0"]) + float(rect["x1"])) / 2, 1),
                        "center_y": round((float(rect["top"]) + float(rect["bottom"])) / 2, 1)
                    })

    lines_by_page = {}
    for line in structure["lines"]:
        page = line["page"]
        if page not in lines_by_page:
            lines_by_page[page] = []
        lines_by_page[page].append(line["y"])

    for page, y_coords in lines_by_page.items():
        y_coords = sorted(set(y_coords))
        for i in range(len(y_coords) - 1):
            structure["row_boundaries"].append({
                "page": page,
                "row_top": y_coords[i],
                "row_bottom": y_coords[i + 1],
                "row_height": round(y_coords[i + 1] - y_coords[i], 1)
            })

    return structure


def main():
    if len(sys.argv) != 3:
        print("用法：extract_form_structure.py <input.pdf> <output.json>")

    print(f"正在从 {pdf_path} 提取结构...")

    print(f"找到：")
    print(f"  - {len(structure['pages'])} 个页面")
    print(f"  - {len(structure['labels'])} 个文本标签")
    print(f"  - {len(structure['lines'])} 条水平线")
    print(f"  - {len(structure['checkboxes'])} 个复选框")
    print(f"  - {len(structure['row_boundaries'])} 个行边界")
    print(f"已保存到 {output_path}")


if __name__ == "__main__":
    main()
