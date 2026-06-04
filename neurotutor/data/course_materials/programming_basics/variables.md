# Variables

## Overview

Variables are fundamental building blocks in programming that serve as containers for storing data values. They allow programmers to assign names to memory locations, making code more readable and maintainable.

## Key Concepts

### 1. What is a Variable?
A variable is a named storage location in computer memory that holds a value which can be changed during program execution.

### 2. Variable Components
- **Name**: Identifier used to reference the variable
- **Value**: Data stored in the variable
- **Type**: Kind of data the variable can hold
- **Memory Address**: Physical location in memory

## Variable Declaration and Initialization

### Python
```python
# Declaration and initialization
name = "John Doe"
age = 25
height = 5.9
is_student = True

# Multiple assignment
x, y, z = 1, 2, 3
```

### JavaScript
```javascript
// Declaration
let name; // uninitialized
const age = 25; // must be initialized
var old_style = "deprecated";

// Initialization
name = "John Doe";
```

### Java
```java
// Declaration with initialization
String name = "John Doe";
int age = 25;
double height = 5.9;
boolean isStudent = true;

// Declaration without initialization
int x;
x = 10; // later initialization
```

## Variable Naming Rules

### General Rules
1. Must start with a letter or underscore (_)
2. Can contain letters, numbers, and underscores
3. Cannot use reserved keywords
4. Case-sensitive (age, Age, AGE are different)

### Best Practices
- Use descriptive names (student_count instead of sc)
- Use snake_case in Python (my_variable)
- Use camelCase in JavaScript/Java (myVariable)
- Avoid single-letter variables except for loop counters

## Data Types

### Primitive Types
- **Integer**: Whole numbers (1, 42, -7)
- **Float/Double**: Decimal numbers (3.14, -2.5)
- **Boolean**: True or False values
- **Character**: Single characters ('a', 'Z')
- **String**: Sequence of characters ("Hello")

### Composite Types
- **Array/List**: Collection of elements
- **Dictionary/Object**: Key-value pairs
- **Tuple**: Immutable collection

## Variable Scope

### Local Scope
```python
def my_function():
    local_var = 10  # Only accessible within function
    return local_var

# print(local_var)  # Error: undefined
```

### Global Scope
```python
global_var = 100  # Accessible throughout the program

def my_function():
    print(global_var)  # Can access global variable
```

### Block Scope
```javascript
if (true) {
    let block_var = "inside block";
    console.log(block_var); // Works
}
// console.log(block_var); // Error: undefined
```

## Variable Types by Language

### Dynamic Typing (Python, JavaScript)
```python
# Type can change
x = 5        # Integer
x = "hello"  # String
x = [1, 2, 3] # List
```

### Static Typing (Java, C++)
```java
int x = 5;        // Must specify type
// x = "hello";   // Error: Type mismatch
```

## Memory Management

### Stack vs Heap
- **Stack**: Local variables, function parameters
- **Heap**: Dynamic allocation, objects

### Garbage Collection
```python
# Python automatically manages memory
import gc
gc.collect()  # Force garbage collection
```

## Common Operations

### Assignment
```python
# Simple assignment
x = 10

# Assignment with operation
x += 5  # x = x + 5
x *= 2  # x = x * 2
```

### Swapping Variables
```python
# Method 1: Using temporary variable
temp = a
a = b
b = temp

# Method 2: Python tuple unpacking
a, b = b, a
```

### Type Conversion
```python
# Implicit conversion
x = 5 + 2.5  # 7.5 (float)

# Explicit conversion
x = int("42")      # 42
y = str(100)       # "100"
z = float("3.14")  # 3.14
```

## Constants

### Python
```python
PI = 3.14159  # Convention: uppercase for constants
```

### JavaScript
```javascript
const PI = 3.14159;  // Cannot be reassigned
```

### Java
```java
final double PI = 3.14159;  // Cannot be changed
```

## Variable Best Practices

### 1. Meaningful Names
```python
# Good
student_count = 25
average_grade = 85.5

# Bad
sc = 25
ag = 85.5
```

### 2. Initialize Variables
```python
# Good
counter = 0
total = 0.0

# Bad (uninitialized)
counter  # May contain garbage value
```

### 3. Use Appropriate Scope
```python
# Keep variables as local as possible
def calculate_average(numbers):
    total = sum(numbers)  # Local scope
    count = len(numbers)
    return total / count
```

### 4. Avoid Magic Numbers
```python
# Bad
area = 3.14159 * radius * radius

# Good
PI = 3.14159
area = PI * radius * radius
```

## Common Pitfalls

### 1. Uninitialized Variables
```python
# Error-prone
def calculate():
    result  # Uninitialized
    result += 10
    return result
```

### 2. Name Shadowing
```python
x = 10  # Global

def my_function():
    x = 20  # Local, shadows global
    print(x)  # 20
```

### 3. Mutable Default Arguments
```python
# Bad
def add_item(item, items=[]):  # Same list used across calls
    items.append(item)
    return items

# Good
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

## Debugging Variables

### Print Debugging
```python
x = 42
print(f"Value of x: {x}")  # Debug output
print(f"Type of x: {type(x)}")
```

### Variable Inspection
```python
import inspect
import sys

def debug_variables():
    local_vars = locals()
    for name, value in local_vars.items():
        print(f"{name}: {value} ({type(value)})")
```

## Related Topics

- **Data Types**: Understanding different variable types
- **Memory Management**: How variables are stored
- **Scope**: Variable accessibility rules
- **Functions**: Variables in function contexts
- **Objects**: Variables as object properties

## Summary

Variables are essential programming concepts that:
- Store and manipulate data
- Make code readable and maintainable
- Enable dynamic program behavior
- Form the foundation of all programming logic

Understanding variables is crucial for:
- Writing clean, efficient code
- Debugging and troubleshooting
- Learning advanced programming concepts
- Working with different programming languages

Master variables before moving to more complex concepts like data structures, algorithms, and object-oriented programming.
