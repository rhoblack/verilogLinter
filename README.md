# 🚀 Verilog-HDL Linter & Formatter

---

### **👨‍💻 만든 사람: 노진호**
**"Verilog 설계자를 위한 최고의 생산성 도구"**

---

Visual Studio Code를 위한 **가장 강력하고 완벽한 Verilog / SystemVerilog 확장 프로그램**입니다.
Synopsys VCS, Cadence Xcelium, Xilinx Vivado(xvlog)와 같은 상용 컴파일러를 백그라운드 린터(Linter)로 활용하여 정확한 실시간 문법 검사를 제공하며, Google Verible 및 iStyle을 연동하여 완벽한 코드 자동 정렬(Formatter) 기능을 지원합니다.

---

## ✨ 주요 기능 (Features)

### 1. 🎨 생동감 있는 구문 강조 (Vibrant Syntax Highlighting)

설치 즉시 추가 설정 없이도 **Verilog / SystemVerilog 전용 프리미엄 색상 팔레트**가 자동 적용됩니다.

- **라이트/다크 테마 자동 적응**: VS Code 테마를 변경하면 읽기 최적화된 색상으로 자동 전환됩니다.
- **세분화된 문법 요소 구분**: 키워드, 타입, 포트, 시스템 태스크 등 문법 요소별로 고유한 색상을 부여합니다.
- **별도 설정 불필요**: 설치 즉시 모든 `.v`, `.vh`, `.sv`, `.svh` 파일에 적용됩니다.

#### 🌙 Dark 테마 색상 팔레트

| 문법 요소 | 예시 | 색상 |
|---|---|---|
| 구조 선언 | `module`, `interface`, `class` | 🩵 청록 (Cyan) Bold |
| 함수/태스크 | `function`, `task` | 🔵 파랑 (Blue) Bold |
| 제어문 | `always_ff`, `if`, `for` | 🌸 핑크 (Pink) |
| 블록 | `begin`, `end`, `fork` | 🟣 보라 (Purple) |
| 포트 방향 | `input`, `output`, `inout` | 🟠 오렌지 (Orange) Bold |
| 내장 타입 | `logic`, `wire`, `bit` | 🔵 하늘 (Light Blue) |
| 시스템 태스크 | `$clog2`, `$display` | 🌕 금색 (Gold) Bold |
| 컴파일러 지시자 | `` `timescale ``, `` `define `` | 🟣 보라 Italic |
| 숫자 리터럴 | `32'hDEAD`, `1'b0` | 🟢 연두 (Light Green) |
| 문자열 | `"output_file.txt"` | 🟢 초록 (Green) |
| 주석 | `// TODO`, `/* ... */` | 🩶 회색 Italic |

#### ☀️ Light 테마 색상 팔레트

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

---

### 2. 🔍 실시간 문법 검사 (Linter)

코드 저장 시 백그라운드에서 상용 시뮬레이터를 실행하여 에러와 경고를 VS Code 편집기 화면에 빨간 줄(Diagnostics)로 즉시 표시해 줍니다.

- **지원하는 린터 엔진:** `vcs`, `xcelium`, `xvlog`
- **스마트 엔진 선택**: 윈도우/리눅스 환경에 맞춰 최적의 린터를 자동으로 선택합니다. (Windows: `xvlog`, Linux: `vcs` 기본)
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

- **`OS Linter Selection`**: 윈도우와 리눅스에서 각각 어떤 툴을 사용할지 설정합니다.
- **`Indentation Spaces`**: 포매팅 시 사용할 공백 칸 수를 지정합니다 (기본 4).
- **`Auto Download`**: Verible 포매터를 자동으로 설치할지 여부를 결정합니다.

---

## ⚠️ 주의 사항 (Precautions)

1. **최초 실행 시 대기**: `Verible` 포매터를 처음 사용할 때, 인터넷 연결을 통해 약 20MB 내외의 다운로드가 진행됩니다. 완료될 때까지 잠시만 기다려 주세요. (진행 상황은 `Verible Downloader` 출력 채널에서 확인 가능)
2. **문법 오류 시 포맷 불가**: 코드에 세미콜론(`;`) 누락 등 문법적인 오류가 있는 상태에서는 포매터가 안전을 위해 작동하지 않습니다. 문법 오류를 먼저 수정한 후 저장해 주세요.
3. **환경 변수 확인**: `vcs`나 `xvlog`를 사용하실 경우, 해당 툴이 시스템 `PATH`에 등록되어 있거나 설정에서 절대 경로를 직접 지정해 주어야 합니다.

---

**Happy Coding with Verilog-HDL Linter!** 🚀
정성껏 만든 이 도구가 여러분의 설계 효율을 극대화해 주기를 바랍니다. 개선 제안은 언제든 환영합니다!
