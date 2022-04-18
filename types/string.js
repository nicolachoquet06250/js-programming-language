export const generateString = (v, reader) => ({
	type: 'str',
	value: reader.escaped(v)
});
