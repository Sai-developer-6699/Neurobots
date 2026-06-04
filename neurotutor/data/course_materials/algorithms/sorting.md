# Sorting Algorithms

## Overview

Sorting algorithms are fundamental procedures that arrange elements in a specific order (typically ascending or descending). They are essential for organizing data efficiently and are used as building blocks for more complex algorithms.

## Key Concepts

### 1. What is Sorting?
Sorting is the process of arranging elements in a collection (array, list) in a particular order based on specific criteria.

### 2. Sorting Criteria
- **Ascending**: Smallest to largest (1, 2, 3, 4, 5)
- **Descending**: Largest to smallest (5, 4, 3, 2, 1)
- **Custom**: Based on specific rules (alphabetical, chronological)

### 3. Stability
- **Stable Sort**: Maintains relative order of equal elements
- **Unstable Sort**: May change relative order of equal elements

## Sorting Algorithm Categories

### 1. Comparison-based Sorts
Compare elements to determine their relative order.

### 2. Non-comparison Sorts
Use properties of data rather than comparisons.

## Common Sorting Algorithms

### 1. Bubble Sort

**Concept**: Repeatedly swap adjacent elements if they're in wrong order.

**Time Complexity**:
- Best: O(n) - when array is already sorted
- Average: O(n²)
- Worst: O(n²)

**Space Complexity**: O(1)

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        # Last i elements are already in place
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

# Example
arr = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(arr))  # [11, 12, 22, 25, 34, 64, 90]
```

**Pros**: Simple to understand and implement
**Cons**: Inefficient for large datasets

### 2. Selection Sort

**Concept**: Find minimum element and place it at beginning.

**Time Complexity**: O(n²) for all cases
**Space Complexity**: O(1)

```python
def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        # Find minimum element in remaining unsorted array
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        
        # Swap minimum element with first element
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

# Example
arr = [64, 25, 12, 22, 11]
print(selection_sort(arr))  # [11, 12, 22, 25, 64]
```

**Pros**: Simple, minimal swaps
**Cons**: Inefficient, not stable

### 3. Insertion Sort

**Concept**: Build sorted array one element at a time.

**Time Complexity**:
- Best: O(n) - when array is already sorted
- Average: O(n²)
- Worst: O(n²)

**Space Complexity**: O(1)

```python
def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        
        # Move elements greater than key to one position ahead
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr

# Example
arr = [12, 11, 13, 5, 6]
print(insertion_sort(arr))  # [5, 6, 11, 12, 13]
```

**Pros**: Efficient for small datasets, stable, adaptive
**Cons**: Inefficient for large datasets

### 4. Merge Sort

**Concept**: Divide array into halves, sort recursively, then merge.

**Time Complexity**: O(n log n) for all cases
**Space Complexity**: O(n)

```python
def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        left = arr[:mid]
        right = arr[mid:]
        
        # Recursively sort both halves
        merge_sort(left)
        merge_sort(right)
        
        # Merge the sorted halves
        i = j = k = 0
        
        while i < len(left) and j < len(right):
            if left[i] < right[j]:
                arr[k] = left[i]
                i += 1
            else:
                arr[k] = right[j]
                j += 1
            k += 1
        
        # Check for remaining elements
        while i < len(left):
            arr[k] = left[i]
            i += 1
            k += 1
        
        while j < len(right):
            arr[k] = right[j]
            j += 1
            k += 1
    
    return arr

# Example
arr = [12, 11, 13, 5, 6, 7]
print(merge_sort(arr))  # [5, 6, 7, 11, 12, 13]
```

**Pros**: Stable, guaranteed O(n log n), suitable for large datasets
**Cons**: Requires additional space

### 5. Quick Sort

**Concept**: Pick pivot element, partition array, sort recursively.

**Time Complexity**:
- Best: O(n log n)
- Average: O(n log n)
- Worst: O(n²) - when pivot is always smallest/largest

**Space Complexity**: O(log n) - due to recursion stack

```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    # Choose pivot (here, last element)
    pivot = arr[-1]
    left = []
    right = []
    equal = []
    
    for element in arr:
        if element < pivot:
            left.append(element)
        elif element > pivot:
            right.append(element)
        else:
            equal.append(element)
    
    return quick_sort(left) + equal + quick_sort(right)

# Example
arr = [10, 7, 8, 9, 1, 5]
print(quick_sort(arr))  # [1, 5, 7, 8, 9, 10]
```

**Pros**: Efficient on average, in-place (with proper implementation)
**Cons**: Worst-case O(n²), not stable

### 6. Heap Sort

**Concept**: Use binary heap data structure to sort elements.

**Time Complexity**: O(n log n) for all cases
**Space Complexity**: O(1)

```python
def heapify(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2
    
    if left < n and arr[left] > arr[largest]:
        largest = left
    
    if right < n and arr[right] > arr[largest]:
        largest = right
    
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

def heap_sort(arr):
    n = len(arr)
    
    # Build max heap
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    
    # Extract elements one by one
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]  # Swap
        heapify(arr, i, 0)
    
    return arr

# Example
arr = [12, 11, 13, 5, 6, 7]
print(heap_sort(arr))  # [5, 6, 7, 11, 12, 13]
```

**Pros**: In-place, guaranteed O(n log n), no worst-case
**Cons**: Not stable, more complex implementation

## Advanced Sorting Algorithms

### 1. Counting Sort

**Concept**: Count occurrences of each element, reconstruct sorted array.

**Time Complexity**: O(n + k) where k is range of input
**Space Complexity**: O(k)

```python
def counting_sort(arr):
    if not arr:
        return arr
    
    max_val = max(arr)
    min_val = min(arr)
    range_val = max_val - min_val + 1
    
    # Initialize count array
    count = [0] * range_val
    
    # Store count of each element
    for num in arr:
        count[num - min_val] += 1
    
    # Reconstruct sorted array
    sorted_arr = []
    for i in range(range_val):
        sorted_arr.extend([i + min_val] * count[i])
    
    return sorted_arr

# Example
arr = [4, 2, 2, 8, 3, 3, 1]
print(counting_sort(arr))  # [1, 2, 2, 3, 3, 4, 8]
```

### 2. Radix Sort

**Concept**: Sort digit by digit, from least significant to most significant.

**Time Complexity**: O(d × (n + k)) where d is number of digits
**Space Complexity**: O(n + k)

```python
def counting_sort_for_radix(arr, exp):
    n = len(arr)
    output = [0] * n
    count = [0] * 10
    
    # Store count of occurrences
    for i in range(n):
        index = (arr[i] // exp) % 10
        count[index] += 1
    
    # Change count[i] to contain actual position
    for i in range(1, 10):
        count[i] += count[i - 1]
    
    # Build output array
    i = n - 1
    while i >= 0:
        index = (arr[i] // exp) % 10
        output[count[index] - 1] = arr[i]
        count[index] -= 1
        i -= 1
    
    return output

def radix_sort(arr):
    if not arr:
        return arr
    
    # Find maximum number
    max_val = max(arr)
    
    # Do counting sort for every digit
    exp = 1
    while max_val // exp > 0:
        arr = counting_sort_for_radix(arr, exp)
        exp *= 10
    
    return arr

# Example
arr = [170, 45, 75, 90, 802, 24, 2, 66]
print(radix_sort(arr))  # [2, 24, 45, 66, 75, 90, 170, 802]
```

## Algorithm Comparison

| Algorithm | Time (Best) | Time (Avg) | Time (Worst) | Space | Stable |
|-----------|--------------|------------|--------------|-------|---------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | No |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| Counting Sort | O(n + k) | O(n + k) | O(n + k) | O(k) | Yes |
| Radix Sort | O(d × (n + k)) | O(d × (n + k)) | O(d × (n + k)) | O(n + k) | Yes |

## Choosing the Right Algorithm

### Small Datasets (< 100 elements)
- **Insertion Sort**: Simple and efficient for nearly sorted data
- **Selection Sort**: When memory is limited

### Medium Datasets (100 - 10,000 elements)
- **Quick Sort**: Generally fastest on average
- **Merge Sort**: When stability is required

### Large Datasets (> 10,000 elements)
- **Merge Sort**: Guaranteed performance
- **Heap Sort**: When memory is limited
- **Quick Sort**: With good pivot selection

### Special Cases
- **Nearly Sorted**: Insertion Sort
- **Limited Range**: Counting Sort
- **Integers with Digits**: Radix Sort
- **External Sorting**: Merge Sort (works with external storage)

## Optimization Techniques

### 1. Hybrid Algorithms
```python
def hybrid_sort(arr):
    # Use insertion sort for small arrays
    if len(arr) < 10:
        return insertion_sort(arr)
    # Use quick sort for larger arrays
    return quick_sort(arr)
```

### 2. Adaptive Algorithms
- Detect if array is partially sorted
- Skip unnecessary operations

### 3. Parallel Sorting
- Divide work among multiple processors
- Useful for very large datasets

## Common Applications

### 1. Data Processing
- Sorting database records
- Organizing file systems
- Preparing data for analysis

### 2. Search Optimization
- Binary search requires sorted data
- Range queries and joins

### 3. User Interfaces
- Sorting tables and lists
- Organizing search results

### 4. Graphics and Multimedia
- Z-ordering for rendering
- Compression algorithms

## Related Topics

- **Searching Algorithms**: Binary search, linear search
- **Data Structures**: Arrays, linked lists, trees
- **Algorithm Analysis**: Big O notation, complexity
- **Recursion**: Used in divide-and-conquer sorts
- **Hash Tables**: For non-comparison sorting

## Summary

Sorting algorithms are fundamental computer science concepts that:
- Organize data efficiently
- Enable faster searching and processing
- Demonstrate different algorithmic approaches
- Provide foundation for advanced topics

Key takeaways:
- No single "best" algorithm for all situations
- Trade-offs between time, space, and stability
- Understanding complexity helps in algorithm selection
- Real-world applications require practical considerations

Master sorting algorithms to understand:
- Algorithm design principles
- Performance analysis
- Problem-solving strategies
- Advanced data structures and algorithms
