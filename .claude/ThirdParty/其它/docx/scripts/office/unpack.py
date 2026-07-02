"""解包 Office 文件（DOCX、PPTX、XLSX）以便编辑。

提取 ZIP 归档，pretty-print XML 文件，并可选择：
- 合并格式相同的相邻文本块（仅 DOCX）
- 简化同一作者的相邻修订（仅 DOCX）

用法：
    python unpack.py <office_file> <output_dir> [options]

示例：
    python unpack.py document.docx unpacked/
    python unpack.py presentation.pptx unpacked/
    python unpack.py document.docx unpacked/ --merge-runs false
"""

import argparse
import sys
import zipfile
from pathlib import Path

import defusedxml.minidom

from helpers.merge_runs import merge_runs as do_merge_runs
from helpers.simplify_redlines import simplify_redlines as do_simplify_redlines

SMART_QUOTE_REPLACEMENTS = {
    "\u201c": "&#x201C;",  
    "\u201d": "&#x201D;",  
    "\u2018": "&#x2018;",  
    "\u2019": "&#x2019;",  
}


def unpack(
    input_file: str,
    output_directory: str,
    merge_runs: bool = True,
    simplify_redlines: bool = True,
) -> tuple[None, str]:
    input_path = Path(input_file)
    output_path = Path(output_directory)
    suffix = input_path.suffix.lower()

    if not input_path.exists():
        return None, f"错误：{input_file} 不存在"

    if suffix not in {".docx", ".pptx", ".xlsx"}:
        return None, f"错误：{input_file} 必须是 .docx、.pptx 或 .xlsx 文件"

    try:
        output_path.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(input_path, "r") as zf:
            zf.extractall(output_path)

        xml_files = list(output_path.rglob("*.xml")) + list(output_path.rglob("*.rels"))
        for xml_file in xml_files:
            _pretty_print_xml(xml_file)

        message = f"已解包 {input_file}（{len(xml_files)} 个 XML 文件）"

        if suffix == ".docx":
            if simplify_redlines:
                simplify_count, _ = do_simplify_redlines(str(output_path))
                message += f"，已简化 {simplify_count} 个修订"

            if merge_runs:
                merge_count, _ = do_merge_runs(str(output_path))
                message += f"，已合并 {merge_count} 个文本块"

        for xml_file in xml_files:
            _escape_smart_quotes(xml_file)

        return None, message

    except zipfile.BadZipFile:
        return None, f"错误：{input_file} 不是有效的 Office 文件"
    except Exception as e:
        return None, f"解包错误：{e}"


def _pretty_print_xml(xml_file: Path) -> None:
    try:
        content = xml_file.read_text(encoding="utf-8")
        dom = defusedxml.minidom.parseString(content)
        xml_file.write_bytes(dom.toprettyxml(indent="  ", encoding="utf-8"))
    except Exception:
        pass  


def _escape_smart_quotes(xml_file: Path) -> None:
    try:
        content = xml_file.read_text(encoding="utf-8")
        for char, entity in SMART_QUOTE_REPLACEMENTS.items():
            content = content.replace(char, entity)
        xml_file.write_text(content, encoding="utf-8")
    except Exception:
        pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="解包 Office 文件（DOCX、PPTX、XLSX）以便编辑"
    )
    parser.add_argument("input_file", help="要解包的 Office 文件")
    parser.add_argument("output_directory", help="输出目录")
    parser.add_argument(
        "--merge-runs",
        type=lambda x: x.lower() == "true",
        default=True,
        metavar="true|false",
        help="合并格式相同的相邻文本块（仅 DOCX，默认为 true）",
    )
    parser.add_argument(
        "--simplify-redlines",
        type=lambda x: x.lower() == "true",
        default=True,
        metavar="true|false",
        help="合并同一作者的相邻修订（仅 DOCX，默认为 true）",
    )
    args = parser.parse_args()

    _, message = unpack(
        args.input_file,
        args.output_directory,
        merge_runs=args.merge_runs,
        simplify_redlines=args.simplify_redlines,
    )
    print(message)

    if "错误" in message:
        sys.exit(1)
