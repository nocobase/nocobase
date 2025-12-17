describe('FormulaField auto-update', () => {
  it('should recompute when dependent fields change', async () => {
    const record = await db.collection('records').create({
      x: 2,
      y: 3,
      z: 1,
      r: 1,
    });

    expect(record.formula).toBe(3);
    await record.update({ x: 4 });
    await record.reload();
    expect(record.formula).toBe(5 - 2);
  });
});
