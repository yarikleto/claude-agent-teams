#!/bin/bash
# iOS MVVM separation enforcement on PreToolUse for Edit and Write tools.
#
# Three layers in an iOS app — View (SwiftUI / UIKit, presentation only),
# ViewModel (presentation logic, no UI framework imports), Model (pure Swift,
# no UI framework imports). Each has rules. This hook blocks edits that
# violate them, plus a few iOS-specific footguns.
#
# Each rule is a separate guarded block — readable, greppable, easy to extend.
# Exit 2 + stderr to block; exit 0 to allow.
#
# Scope: Swift source files only. Markdown, plist, xcconfig, fastlane Ruby,
# etc. are skipped — those are documents / configuration that may legitimately
# discuss the patterns we forbid in code.

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

if [ -z "$FILE_PATH" ] || [ -z "$NEW_CONTENT" ]; then
  exit 0
fi

PATH_LOWER=$(echo "$FILE_PATH" | tr '[:upper:]' '[:lower:]')

is_swift_source() {
  case "$PATH_LOWER" in
    *.swift) return 0 ;;
  esac
  return 1
}

# Anchored to common iOS-project directory shapes. Bare */view/* would match
# documentation paths; require a feature- or layer-level parent marker.
is_view_file() {
  case "$PATH_LOWER" in
    */views/*|*/view/*|*view.swift) return 0 ;;
    */features/*/views/*|*/features/*/view/*) return 0 ;;
    */ui/*|*/screens/*) return 0 ;;
  esac
  return 1
}

is_viewmodel_file() {
  case "$PATH_LOWER" in
    */viewmodels/*|*/viewmodel/*|*viewmodel.swift) return 0 ;;
    */features/*/viewmodels/*|*/features/*/viewmodel/*) return 0 ;;
    *presenter.swift|*store.swift) return 0 ;;
  esac
  return 1
}

is_model_file() {
  case "$PATH_LOWER" in
    */models/*|*/model/*) return 0 ;;
    */features/*/models/*|*/features/*/model/*) return 0 ;;
    */domain/*|*/entities/*) return 0 ;;
  esac
  return 1
}

block() {
  local rule="$1"
  local detail="$2"
  echo "iOS IRON-RULE VIOLATION: $rule" >&2
  echo "File: $FILE_PATH" >&2
  echo "$detail" >&2
  exit 2
}

# Rule V1: View files must not do business logic — no direct networking or persistence.
# URLSession / CoreData / SwiftData / GRDB belong behind a ViewModel or repository.
if is_swift_source && is_view_file; then
  if echo "$NEW_CONTENT" | grep -Eq '\bURLSession\.shared\b|\bURLSession\(\b|\.dataTask\(|URLRequest\('; then
    block "view: direct networking is forbidden" \
      "URLSession belongs in a service / repository called from the ViewModel. Bind the View to @Published / @Observable state, not network code."
  fi
  if echo "$NEW_CONTENT" | grep -Eq '\bNSPersistentContainer\b|\bNSManagedObjectContext\b|\bmodelContext\.save\(\)|\bmodelContext\.delete\('; then
    block "view: direct persistence is forbidden" \
      "Core Data / SwiftData contexts belong in the data layer, surfaced via the ViewModel. Views read derived state, not the store."
  fi
  if echo "$NEW_CONTENT" | grep -Eq '\bFileManager\.default\.(createFile|removeItem|moveItem|copyItem|write)'; then
    block "view: direct filesystem mutation is forbidden" \
      "File IO belongs behind a service the ViewModel injects. Views render; they do not write to disk."
  fi
fi

# Rule VM1: ViewModel files must stay UI-framework-agnostic — no SwiftUI / UIKit imports.
# Combine and Foundation are fine; the boundary is the UI rendering layer.
if is_swift_source && is_viewmodel_file; then
  if echo "$NEW_CONTENT" | grep -Eq '^\s*import\s+SwiftUI\b'; then
    block "viewmodel: import SwiftUI is forbidden" \
      "ViewModels must be UI-framework-agnostic so they are testable without a window and reusable across Views. Move SwiftUI-specific code (View, ViewModifier, Color) into the View layer; expose plain values from the ViewModel."
  fi
  if echo "$NEW_CONTENT" | grep -Eq '^\s*import\s+UIKit\b'; then
    block "viewmodel: import UIKit is forbidden" \
      "ViewModels must not import UIKit. UIImage, UIColor, UIApplication belong in the View. Surface platform-neutral values (Data, CGFloat, hex strings) and let the View construct UIKit types."
  fi
fi

# Rule M1: Model layer must be pure Swift — no UI framework imports, no presentation.
if is_swift_source && is_model_file; then
  if echo "$NEW_CONTENT" | grep -Eq '^\s*import\s+SwiftUI\b'; then
    block "model: import SwiftUI is forbidden" \
      "Domain models must not depend on SwiftUI. A model that knows about View, Color, or @State is no longer a model — it is a ViewModel in disguise."
  fi
  if echo "$NEW_CONTENT" | grep -Eq '^\s*import\s+UIKit\b'; then
    block "model: import UIKit is forbidden" \
      "Domain models must not depend on UIKit. Keep models portable to share with widget extensions, watchOS, and unit tests that do not link UIKit."
  fi
fi

# Rule X1: force-unwraps on optionals in production source are a recurring crash source.
# Allow them in test files (where the failure is loud and useful).
case "$PATH_LOWER" in
  */tests/*|*tests.swift|*test.swift|*spec.swift) ;;
  *)
    if is_swift_source; then
      # Catch `try!` outside string interpolation. Conservative regex — only flags the leading form.
      if echo "$NEW_CONTENT" | grep -Eq '(^|[^a-zA-Z0-9_])try!\s+[A-Za-z_]'; then
        block "any: try! in production code is discouraged" \
          "try! crashes on any thrown error. Use do/catch with a typed error, or throws + propagation. Reserve try! for tests."
      fi
    fi
    ;;
esac

# Rule X2: Storyboard / xib references in SwiftUI-first projects are a smell.
# Skipped — coexistence with UIKit interop is explicitly supported. The reviewer
# enforces "no new storyboards" by policy, not by hook.

exit 0
