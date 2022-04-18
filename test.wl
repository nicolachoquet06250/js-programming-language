let toto = 10000;
let test = "10";
# commentaire
let tata = fn(tete) { # autre commentaire
	print(tete);
	print(toto);
};

if (toto) {
	print(test);
} else if (test) {
	print(toto);
} else {
	print('tralala');
}

test = "tara";
print(test);
let test_array = ['test', 12, toto];
print(test_array);
test_array.add(test_array);
# array.remove(0);

# gérer les operateurs binaire et de comparaison
print(toto !== false);
tata('tralala');
print(test_array);

print(toto);
