### [**[NoRWX] Proof-of-Concept**](https://mrzaxaryan.blog/content/NoRWX/)  
**Purpose:** Demonstrates running position-independent (PIC) x86-64 machine code to output "Hello World" in RW-only memory, without marking it executable.  
**Key Features:**  
  
 - No executable memory required  
 - Hardware breakpoints + VEH technique  
 - Security-focused demonstration  
  
**Technologies Used:** x86-64 assembly, C.  
**Status:** Experimental, for research and educational use.  
**Audience:** Security researchers, low-level programmers.  

---

### [**[c-pic] Fully position-independent code implementation in C**](https://mrzaxaryan.blog/content/c-pic/) 
**Purpose:** Fully position-independent code implementation in C with manual API resolution.  
**Key Features:**
 
 - No imports, no standard library, position-independent code, no fixed addresses
 - Embed and retrieve strings without fixed addresses  
 - Direct TEB/PEB access   
 - Works on x86 and x64 
 - PEB walking

**Technologies:** C, Windows internals, Linux systemcalls  
**Status:** Experimental  
**Audience:** Systems programmers, low-level developers, security researchers

---

### [**[EC] Armenian Encoding Converter**](https://mrzaxaryan.blog/content/EC/)  
**Purpose:** Converts Armenian text between multiple encodings (ANSI, Unicode, ArmSCII, etc.).  
**Key Features:**

 - Supports multiple Armenian encodings  
 - Batch conversion  
 - Word/Excel converters (TXT/DOC/DOCX/XLS/XLSX)  

**Technologies:** C#, .NET 9  
**Status:** Beta  
**Audience:** Linguists, developers dealing with Armenian text, localization engineers

---