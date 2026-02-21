# 🚀 Verilog-HDL Linter & Formatter

---

### **👨‍💻 만든 사람: 노진호**
**"Verilog 설계자를 위한 최고의 생산성 도구"**

---

Visual Studio Code를 위한 **가장 강력하고 완벽한 Verilog / SystemVerilog 확장 프로그램**입니다.
Synopsys VCS, Cadence Xcelium, Xilinx Vivado(xvlog)와 같은 상용 컴파일러를 백그라운드 린터(Linter)로 활용하여 정확한 실시간 문법 검사를 제공하며, Google Verible 및 iStyle을 연동하여 완벽한 코드 자동 정렬(Formatter) 기능을 지원합니다.

---

## ✨ 주요 기능 (Features)

### 1. 🎨 지능형 구문 강조 (Intelligent Syntax Highlighting)

설치 즉시 **Verilog / SystemVerilog 전용 프리미엄 색상 팔레트**가 자동 적용됩니다.
사용자의 취향과 환경에 맞춰 **3가지 색상 모드**를 제공합니다.

#### ⚙️ 색상 모드 설정

VS Code 설정(`Ctrl + ,`) → `verilogLinter highlight` 검색:

| 모드 | 설명 |
|---|---|
| **`16color`** (기본값) | 키워드, 타입, 포트, 시스템 태스크, 연산자, 숫자, UVM 등 **16가지 세부 요소**별로 고유한 색상을 부여합니다. |
| **`4color`** | 키워드(보라), 타입(청록), 상수(초록), 주석(녹색)의 **4가지 그룹**으로 간결하게 구분합니다. 심플한 디자인을 선호하는 분께 추천합니다. |
| **`off`** | 확장의 색상 커스터마이징을 비활성화하고, 현재 사용 중인 VS Code 테마의 기본 색상을 사용합니다. |

#### 🌗 Dark / Light 테마 자동 적응

- 어떤 VS Code 테마를 사용하더라도, **Dark/Light 모드를 자동으로 감지**하여 최적의 대비를 가진 팔레트로 즉시 전환합니다.
- 설정 변경 시 **Reload Window 없이 실시간 반영**됩니다.

#### 🌙 16색 Dark 모드 팔레트

| 문법 요소 | 예시 | 색상 |
|---|---|---|
| 구조 선언 | `module`, `interface`, `class` | 🩵 청록 Bold |
| 함수/태스크 | `function`, `task` | 🔵 파랑 Bold |
| 제어문 | `always_ff`, `if`, `for` | 🌸 핑크 |
| 블록 | `begin`, `end`, `fork` | 🟣 보라 |
| 포트 방향 | `input`, `output`, `inout` | 🟠 오렌지 Bold |
| 내장 타입 | `logic`, `wire`, `bit` | 🔵 하늘 |
| 시스템 태스크 | `$clog2`, `$display` | 🌕 금색 Bold |
| 컴파일러 지시자 | `` `timescale ``, `` `define `` | 🟣 보라 Italic |
| UVM 클래스 | `uvm_component` | 🟢 민트 |
| 숫자 리터럴 | `32'hDEAD`, `1'b0` | 🟢 연두 |
| 문자열 | `"output_file.txt"` | 🟢 초록 |
| 주석 | `// TODO`, `/* ... */` | 🩶 회색 Italic |

#### ☀️ 16색 Light 모드 팔레트

| 문법 요소 | 예시 | 색상 |
|---|---|---|
| 구조 선언 | `module`, `interface` | 🔵 짙은 청록 Bold |
| 함수/태스크 | `function`, `task` | 🔵 짙은 파랑 Bold |
| 제어문 | `always_ff`, `if`, `for` | 🟣 진한 보라 |
| 블록 | `begin`, `end`, `fork` | 🟣 인디고 |
| 포트 방향 | `input`, `output`, `inout` | 🟤 짙은 오렌지 Bold |
| 내장 타입 | `logic`, `wire`, `bit` | 🩵 짙은 청록 |
| 시스템 태스크 | `$clog2`, `$display` | 🟫 갈색 Bold |
| 숫자 리터럴 | `32'hDEAD` | 🟢 짙은 초록 |
| 문자열 | `"output_file.txt"` | 🔴 진한 빨강 |
| 주석 | `// TODO` | 🍃 녹색 Italic |

#### 🎯 4색 모드 팔레트

| 그룹 | 포함 요소 | 🌙 Dark | ☀️ Light |
|---|---|---|---|
| 키워드 | `module`, `if`, `begin`, `input`, `` `define `` 등 | 🟣 보라 | 🟣 진한 보라 |
| 타입 | `logic`, `wire`, `$clog2`, UVM 등 | 🩵 청록 | 🩵 짙은 청록 |
| 상수 | 숫자, 연산자, 파라미터 등 | 🟢 연두 | 🟢 짙은 초록 |
| 주석/문자열 | 주석, 문자열 | 🍃 녹색 Italic | 🍃 녹색 Italic |

---

### 2. 🔍 실시간 문법 검사 (Linter)

코드 저장 시 백그라운드에서 상용 시뮬레이터를 실행하여 에러와 경고를 VS Code 편집기 화면에 빨간 줄(Diagnostics)로 즉시 표시해 줍니다.

- **지원하는 린터 엔진:** `vcs`, `xcelium`, `xvlog`
- **스마트 엔진 선택**: 윈도우/리눅스 환경에 맞춰 최적의 린터를 자동으로 선택합니다. (Windows: `xvlog`, Linux: `vcs` 기본)
- **UVM 지원**: Vivado/VCS/Xcelium에서 UVM 라이브러리 경로를 자동 감지하여 UVM 코드도 오류 없이 검사합니다.
- **리모트 최적화**: Remote-SSH 환경에서 사용자의 `.bash_profile` 환경 변수를 완벽하게 상속하여 작동합니다.

### 3. 🧹 코드 자동 정렬 (Formatter)

복잡한 SystemVerilog 코드를 단축키(`Shift + Alt + F`) 한 번으로 깔끔하게 정렬합니다.

- **Verible 자동 다운로드**: 별도의 설치 없이도 확장 프로그램이 OS에 맞는 최신 `Verible`을 자동으로 다운로드하여 설정합니다.
- **동적 들여쓰기**: 유저 설정에 따라 2칸, 4칸 등 자유로운 정렬 스타일을 지원합니다.

### 4. 💡 인텔리전트 도구 (Intellisense & Navigation)

- **Hover 정보**: 신호(Signal)나 모듈 위에 마우스를 올리면 해당 심볼의 정의와 위치 정보를 즉시 보여줍니다.
- **자동 완성 (Completion)**: 워크스페이스 내의 모든 모듈 인스턴스와 신호들을 인덱싱하여 빠른 코드 작성을 도와줍니다.
- **심볼 네비게이션**: 대규모 프로젝트에서도 모듈 구조를 빠르게 파악하고 이동할 수 있습니다.

### 5. 🎯 전문 스니펫 (Advanced Snippets)

테스트벤치 템플릿, FSM 구조, 모듈 선언 등 50여 개의 하이-퀄리티 전문 스니펫을 제공합니다.

---

## ⚙️ 권장 설정 (Recommended Settings)

VS Code 설정(`Ctrl + ,`)에서 `verilogLinter`를 검색하여 아래 항목을 확인하세요.

| 설정 | 설명 | 기본값 |
|---|---|---|
| `highlight.colorMode` | 구문 강조 색상 모드 (`16color` / `4color` / `off`) | `16color` |
| `linting.linter` | 린터 엔진 선택 (`auto` / `vcs` / `xvlog` / `xcelium` / `none`) | `auto` |
| `linting.windowsLinter` | Windows에서 사용할 린터 | `xvlog` |
| `linting.linuxLinter` | Linux에서 사용할 린터 | `vcs` |
| `formatting.indentationSpaces` | 포매팅 시 공백 칸 수 | `4` |
| `formatting.autoDownload` | Verible 자동 다운로드 여부 | `true` |

---

## ⚠️ 주의 사항 (Precautions)

1. **환경 변수 확인**: `vcs`나 `xvlog`를 사용하실 경우, 해당 툴이 시스템 `PATH`에 등록되어 있거나 설정에서 절대 경로를 직접 지정해 주어야 합니다.

---

**Happy Coding with Verilog-HDL Linter!** 🚀
정성껏 만든 이 도구가 여러분의 설계 효율을 극대화해 주기를 바랍니다. 개선 제안은 언제든 환영합니다!
