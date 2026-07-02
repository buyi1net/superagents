"""
根据 XSD schema 和修订追踪校验 Office 文档 XML 文件的命令行工具。

用法：
    python validate.py <path> [--original <original_file>] [--auto-repair] [--author NAME]

第一个参数可以是：
- 包含 Office 文档 XML 文件的已解包目录
- 打包的 Office 文件（.docx/.pptx/.xlsx），将被解包到临时目录

自动修复处理：
- 超出 OOXML 限制的 paraId/durableId 值
- 带空白的 w:t 元素缺少 xml:space="preserve"
"""

import argparse
import sys
import tempfile
import zipfile
from pathlib import Path

from validators import DOCXSchemaValidator, PPTXSchemaValidator, RedliningValidator


def main():
    parser = argparse.ArgumentParser(description="校验 Office 文档 XML 文件")
    parser.add_argument(
        "path",
        help="已解包目录或打包的 Office 文件（.docx/.pptx/.xlsx）的路径",
    )
    parser.add_argument(
        "--original",
        required=False,
        default=None,
        help="原始文件的路径（.docx/.pptx/.xlsx）。如省略，将报告所有 XSD 错误并跳过修订校验。",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="启用详细输出",
    )
    parser.add_argument(
        "--auto-repair",
        action="store_true",
        help="自动修复常见问题（十六进制 ID、空白保留）",
    )
    parser.add_argument(
        "--author",
        default="Opencode",
        help="修订校验的作者名（默认为 Opencode）",
    )
    args = parser.parse_args()

    path = Path(args.path)
    assert path.exists(), f"错误：{path} 不存在"

    original_file = None
    if args.original:
        original_file = Path(args.original)
        assert original_file.is_file(), f"错误：{original_file} 不是文件"
        assert original_file.suffix.lower() in [".docx", ".pptx", ".xlsx"], (
            f"错误：{original_file} 必须是 .docx、.pptx 或 .xlsx 文件"
        )

    file_extension = (original_file or path).suffix.lower()
    assert file_extension in [".docx", ".pptx", ".xlsx"], (
        f"错误：无法从 {path} 确定文件类型。请使用 --original 或提供 .docx/.pptx/.xlsx 文件。"
    )

    if path.is_file() and path.suffix.lower() in [".docx", ".pptx", ".xlsx"]:
        temp_dir = tempfile.mkdtemp()
        with zipfile.ZipFile(path, "r") as zf:
            zf.extractall(temp_dir)
        unpacked_dir = Path(temp_dir)
    else:
        assert path.is_dir(), f"错误：{path} 不是目录或 Office 文件"
        unpacked_dir = path

    match file_extension:
        case ".docx":
            validators = [
                DOCXSchemaValidator(unpacked_dir, original_file, verbose=args.verbose),
            ]
            if original_file:
                validators.append(
                    RedliningValidator(unpacked_dir, original_file, verbose=args.verbose, author=args.author)  
                )
        case ".pptx":
            validators = [
                PPTXSchemaValidator(unpacked_dir, original_file, verbose=args.verbose),
            ]
        case _:
            print(f"错误：不支持对 {file_extension} 文件类型进行校验")
            sys.exit(1)

    if args.auto_repair:
        total_repairs = sum(v.repair() for v in validators)
        if total_repairs:
            print(f"自动修复了 {total_repairs} 个问题")

    success = all(v.validate() for v in validators)

    if success:
        print("全部校验通过！")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
