# NocoBase Snowflake ID


This package provides a modified **Snowflake ID generator** designed for safer use in JavaScript and MySQL.

---

## Background

- The [`mysql2`](https://github.com/sidorares/node-mysql2) package has a known bug when handling **BigInt** values in prepared statements:  
  - [https://github.com/sidorares/node-mysql2/issues/1239](https://github.com/sidorares/node-mysql2/issues/1239)  
  - [https://github.com/sidorares/node-mysql2/pull/1407](https://github.com/sidorares/node-mysql2/pull/1407)

- Many frontend form components also face **precision loss** when dealing with `BigInt`.

To avoid these issues, we redesigned the original **64-bit Snowflake algorithm** to generate **53-bit IDs**.  
This ensures the IDs are safe within JavaScript’s `Number.MAX_SAFE_INTEGER`.

---

## ID Structure (53 bits)

The new Snowflake ID is composed of the following fields:

```text
| 0 (1 bit) |----------- 31 bits -----------|-- 5 bits --|------ 16 bits ------|
|   Sign    |        Timestamp (sec)        | Machine ID |       Sequence      |
```

- **Sign (1 bit)**: Always `0`, ensures positive numbers.  
- **Timestamp (31 bits)**: Seconds since a custom epoch.  
- **Machine ID (5 bits)**: Supports up to 32 nodes.  
- **Sequence (16 bits)**: Auto-increment counter, allows 65,536 IDs per second per machine.
