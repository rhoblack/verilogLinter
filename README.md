# 🚀 Verilog-HDL Linter & Formatter

Visual Studio Code를 위한 **가장 강력하고 완벽한 Verilog / SystemVerilog 확장 프로그램**입니다.
Synopsys VCS, Cadence Xcelium, Xilinx Vivado(xvlog)와 같은 상용 컴파일러를 백그라운드 린터(Linter)로 활용하여 정확한 실시간 문법 검사를 제공하며, Google Verible 및 iStyle을 연동하여 완벽한 코드 자동 정렬(Formatter) 기능을 지원합니다.

---

## ✨ 주요 기능 (Features)

### 1. 🔍 실시간 문법 검사 (Linter)
코드 저장 시 백그라운드에서 상용 시뮬레이터를 실행하여 에러와 경고를 VS Code 편집기 화면에 빨간 줄(Diagnostics)로 즉시 표시해 줍니다.
- **지원하는 린터 엔진:**
  - `vcs` (Synopsys VCS)
  - `xcelium` (Cadence Xcelium / xrun)
  - `xvlog` (Xilinx Vivado)
- 🌐 **완벽한 Remote-SSH 지원**: 윈도우 로컬 환경뿐만 아니라, 리눅스 원격 환경에서도 사용자의 로그인 `.bash_profile` 환경 변수(`VCS_HOME` 등)를 그대로 상속받아 100% 정상 작동합니다.

### 2. 🧹 코드 자동 정렬 (Formatter)
들여쓰기가 망가진 코드를 단축키(`Shift + Alt + F`) 한 번으로 깔끔하게 정렬합니다. 복잡한 SystemVerilog의 OOP 구조(class, covergroup, constraint 등)도 완벽하게 지원합니다.
- **지원하는 포매터 엔진:**
  - `verible-verilog-format` (Google Verible - **강력 추천**)
  - `istyle-verilog-formatter`
- **동적 들여쓰기 옵션**: 설정에서 원하는 들여쓰기 칸 수(`Indentation Spaces`)를 4칸, 2칸 등으로 자유롭게 지정할 수 있습니다.

### 3. 🎨 구문 강조 (Syntax Highlighting)
정통 TextMate 문법을 채택하여 Verilog 및 SystemVerilog의 수많은 키워드, 매크로, 시스템 함수들을 아름다운 색상으로 강조해 줍니다.

---

## ⚙️ 설정 방법 (Configuration)

VS Code 설정(`Ctrl + ,`)에서 `verilogLinter`를 검색하여 아래의 옵션들을 자신의 환경에 맞게 세팅하세요.

### Linter 설정 예시
* **`verilogLinter.linting.linter`**: 사용할 린터 선택 (`vcs`, `xcelium`, `xvlog`, `none`)
* **`verilogLinter.linting.vcs.executable`**: `vcs` 명령어 절대 경로 (PATH에 있다면 `vcs` 입력)
* **`verilogLinter.linting.vcs.arguments`**: 추가할 인수 (기본값: `-lint=all -sverilog`)

### Formatter 설정 예시
* **`verilogLinter.formatting.formatter`**: 사용할 포매터 선택 (`verible-verilog-format`, `istyle-verilog-formatter`, `none`)
* **`verilogLinter.formatting.indentationSpaces`**: 정렬 시 들여쓰기할 공백 칸 수 (기본값: `4`)

---

## 🛠️ Verible 포매터 연동 가이드 (Linux 원격 서버 기준)

구글(Google)의 `Verible`은 완벽한 SystemVerilog 정렬을 지원하는 필수 도구입니다. 리눅스 서버에 아래와 같이 설치하고 연동해 주세요.

### 1. 최신 Verible 다운로드 및 압축 해제
원격 리눅스 터미널에서 아래 명령어를 차례대로 실행합니다.

```bash
cd ~
wget https://github.com/chipsalliance/verible/releases/download/v0.0-4051-g9fdb4057/verible-v0.0-4051-g9fdb4057-linux-static-x86_64.tar.gz
tar -xvf verible-v0.0-4051-g9fdb4057-linux-static-x86_64.tar.gz
```

### 2. VS Code 경로 지정
압축이 풀린 폴더 안의 `bin` 디렉토리에 실행 파일이 생깁니다.
터미널에서 `pwd` 명령어로 절대 경로를 확인한 후, VS Code 설정 창에 기입합니다.

* 설정 항목: **`verilogLinter.formatting.verible.executable`**
* 입력 예시: `/home/아이디/verible-v0.0-4051-g9fdb4057-linux-static-x86_64/bin/verible-verilog-format`

### 3. 사용하기
Verilog/SystemVerilog 코드(`*.v`, `*.sv`)를 열고 **`Shift + Alt + F`** 를 누르거나, 마우스 우클릭 후 **'문서 형식 지정(Format Document)'** 를 클릭하면 코드가 마법처럼 정렬됩니다!

---

**Happy Coding with Verilog-HDL Linter!** 🚀
